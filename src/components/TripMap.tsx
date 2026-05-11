"use client";

import { useEffect, useMemo, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { TripBundle, SlotKind } from "@/lib/types";
import { SLOT_COLOR } from "@/lib/types";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

type Winner = {
  id: string;
  lat: number;
  lng: number;
  name: string;
  kind: SlotKind;
};

export default function TripMap({
  bundle,
  activeSlotId,
}: {
  bundle: TripBundle;
  activeSlotId: string | null;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const routeReqRef = useRef(0);

  // Compute winning suggestions per slot.
  const winners: Winner[] = useMemo(() => {
    const out: Winner[] = [];
    const slotById = new Map(bundle.slots.map((s) => [s.id, s]));
    const byId = new Map(bundle.suggestions.map((s) => [s.id, s]));
    const counts: Record<string, number> = {};
    for (const v of bundle.votes) counts[v.suggestion_id] = (counts[v.suggestion_id] ?? 0) + 1;

    // Group suggestions by slot.
    const bySlot = new Map<string, string[]>();
    for (const s of bundle.suggestions) {
      const arr = bySlot.get(s.slot_id) ?? [];
      arr.push(s.id);
      bySlot.set(s.slot_id, arr);
    }
    for (const [slotId, ids] of bySlot) {
      const slot = slotById.get(slotId);
      if (!slot) continue;
      const sorted = ids.slice().sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0));
      for (let i = 0; i < Math.min(slot.capacity, sorted.length); i++) {
        const s = byId.get(sorted[i])!;
        if (s.lat == null || s.lng == null) continue;
        if ((counts[s.id] ?? 0) === 0) continue; // only show actually-voted winners
        out.push({
          id: s.id,
          lat: s.lat,
          lng: s.lng,
          name: s.name,
          kind: slot.kind as SlotKind,
        });
      }
    }
    return out;
  }, [bundle.slots, bundle.suggestions, bundle.votes]);

  // Init map once.
  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const first = bundle.stops[0];
    const map = new mapboxgl.Map({
      container: ref.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: first ? [first.lng, first.lat] : [10.75, 59.91],
      zoom: first ? 6 : 4,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    map.on("load", () => {
      map.addSource("route", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#0c0a09",
          "line-width": 3,
          "line-opacity": 0.7,
        },
      });
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render markers when bundle changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    bundle.stops.forEach((stop, i) => {
      const letter = String.fromCharCode(65 + i);
      const el = document.createElement("div");
      el.className = "stop-pin";
      el.textContent = letter;
      Object.assign(el.style, {
        background: "#0c0a09",
        color: "#fdfaf4",
        width: "28px",
        height: "28px",
        borderRadius: "999px",
        display: "grid",
        placeItems: "center",
        fontWeight: "700",
        fontSize: "12px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
      } as Partial<CSSStyleDeclaration>);
      const m = new mapboxgl.Marker({ element: el })
        .setLngLat([stop.lng, stop.lat])
        .setPopup(new mapboxgl.Popup({ offset: 18 }).setHTML(`<b>${escape(stop.name)}</b>`))
        .addTo(map);
      markersRef.current.push(m);
    });

    winners.forEach((w) => {
      const el = document.createElement("div");
      Object.assign(el.style, {
        background: SLOT_COLOR[w.kind],
        width: "14px",
        height: "14px",
        borderRadius: "999px",
        border: "2px solid #fff",
        boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
      } as Partial<CSSStyleDeclaration>);
      const m = new mapboxgl.Marker({ element: el })
        .setLngLat([w.lng, w.lat])
        .setPopup(new mapboxgl.Popup({ offset: 12 }).setHTML(`<b>${escape(w.name)}</b>`))
        .addTo(map);
      markersRef.current.push(m);
    });

    // Fit bounds.
    const pts = [
      ...bundle.stops.map((s) => [s.lng, s.lat] as [number, number]),
      ...winners.map((w) => [w.lng, w.lat] as [number, number]),
    ];
    if (pts.length >= 2) {
      const bounds = pts.reduce(
        (b, p) => b.extend(p),
        new mapboxgl.LngLatBounds(pts[0], pts[0]),
      );
      map.fitBounds(bounds, { padding: 60, duration: 600, maxZoom: 10 });
    } else if (pts.length === 1) {
      map.flyTo({ center: pts[0], zoom: 9, duration: 600 });
    }
  }, [bundle.stops, winners]);

  // Fetch driving route when stops change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const coords = bundle.stops.map((s) => ({ lat: s.lat, lng: s.lng }));
    if (coords.length < 2) {
      if (map.isStyleLoaded() && map.getSource("route")) {
        (map.getSource("route") as mapboxgl.GeoJSONSource).setData({
          type: "FeatureCollection",
          features: [],
        });
      }
      return;
    }
    const reqId = ++routeReqRef.current;
    fetch("/api/directions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coords }),
    })
      .then((r) => r.json())
      .then((data: { route?: { geometry: GeoJSON.LineString } | null }) => {
        if (reqId !== routeReqRef.current) return;
        const apply = () => {
          const src = map.getSource("route") as mapboxgl.GeoJSONSource | undefined;
          if (!src) return;
          src.setData(
            data.route
              ? {
                  type: "Feature",
                  geometry: data.route.geometry,
                  properties: {},
                }
              : { type: "FeatureCollection", features: [] },
          );
        };
        if (map.isStyleLoaded()) apply();
        else map.once("load", apply);
      })
      .catch(() => {});
  }, [bundle.stops]);

  // Highlight active slot's winner by flying to it.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !activeSlotId) return;
    const slot = bundle.slots.find((s) => s.id === activeSlotId);
    if (!slot) return;
    const stop = bundle.stops.find((s) => s.id === slot.stop_id);
    if (!stop) return;
    map.flyTo({ center: [stop.lng, stop.lat], zoom: 11, duration: 700 });
  }, [activeSlotId, bundle.slots, bundle.stops]);

  return <div ref={ref} className="h-full w-full" />;
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
