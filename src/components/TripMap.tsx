"use client";

import { useEffect, useMemo, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { TripBundle, Category } from "@/lib/types";
import { CATEGORY_COLOR } from "@/lib/types";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

type Winner = {
  id: string;
  lat: number;
  lng: number;
  name: string;
  category: Category | null;
};

export default function TripMap({
  bundle,
  activeStopId,
  onStopClick,
}: {
  bundle: TripBundle;
  activeStopId?: string | null;
  onStopClick?: (stopId: string) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const routeReqRef = useRef(0);

  const winners: Winner[] = useMemo(() => {
    const out: Winner[] = [];
    const dayById = new Map(bundle.days.map((d) => [d.id, d]));
    const byId = new Map(bundle.suggestions.map((s) => [s.id, s]));
    const counts: Record<string, number> = {};
    for (const v of bundle.votes) counts[v.suggestion_id] = (counts[v.suggestion_id] ?? 0) + 1;

    const byDay = new Map<string, string[]>();
    for (const s of bundle.suggestions) {
      const arr = byDay.get(s.day_id) ?? [];
      arr.push(s.id);
      byDay.set(s.day_id, arr);
    }
    for (const [dayId, ids] of byDay) {
      const day = dayById.get(dayId);
      if (!day) continue;
      const sorted = ids.slice().sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0));
      for (let i = 0; i < Math.min(day.capacity, sorted.length); i++) {
        const s = byId.get(sorted[i])!;
        if (s.lat == null || s.lng == null) continue;
        if ((counts[s.id] ?? 0) === 0) continue;
        out.push({
          id: s.id,
          lat: s.lat,
          lng: s.lng,
          name: s.name,
          category: (s.category as Category | null) ?? null,
        });
      }
    }
    return out;
  }, [bundle.days, bundle.suggestions, bundle.votes]);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const first = bundle.stops[0];
    const map = new mapboxgl.Map({
      container: ref.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      projection: { name: "globe" },
      center: first ? [first.lng, first.lat] : [10.75, 59.91],
      zoom: first ? 4.6 : 1.4,
      attributionControl: false,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-left");
    map.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      "bottom-right",
    );

    map.on("style.load", () => {
      map.setFog({
        color: "rgb(252, 232, 207)",
        "high-color": "rgb(196, 99, 60)",
        "horizon-blend": 0.06,
        "space-color": "rgb(20, 14, 30)",
        "star-intensity": 0.65,
      });
    });

    map.on("load", () => {
      map.addSource("route", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "route-glow",
        type: "line",
        source: "route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#c4633c",
          "line-width": 10,
          "line-opacity": 0.22,
          "line-blur": 6,
        },
      });
      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#2a2520",
          "line-width": 3,
          "line-opacity": 0.85,
          "line-dasharray": [0.6, 1.4],
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

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    bundle.stops.forEach((stop, i) => {
      const letter = String.fromCharCode(65 + i);
      const isActive = stop.id === activeStopId;
      const el = document.createElement("button");
      el.type = "button";
      el.setAttribute("aria-label", stop.name);
      el.style.cursor = "pointer";
      el.style.background = "transparent";
      el.style.border = "0";
      el.style.padding = "0";
      el.innerHTML = `
        <span style="
          position: relative;
          display: grid;
          place-items: center;
          width: ${isActive ? 44 : 36}px;
          height: ${isActive ? 44 : 36}px;
          border-radius: 999px;
          background: linear-gradient(135deg, #fcd34d 0%, #c4633c 95%);
          color: #2a2520;
          font-weight: 800;
          font-size: ${isActive ? 16 : 13}px;
          box-shadow:
            0 0 0 3px #faf6ef,
            0 0 ${isActive ? 32 : 20}px ${isActive ? 8 : 5}px rgba(252,211,77,0.55),
            0 8px 18px -4px rgba(42,37,32,0.55);
          font-family: var(--font-fraunces), serif;
        ">${letter}</span>
      `;
      if (onStopClick) {
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          onStopClick(stop.id);
        });
      }
      const m = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([stop.lng, stop.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 24, closeButton: false }).setHTML(
            `<div style="font-family: var(--font-fraunces), serif; font-weight: 600; font-size: 14px;">${escapeHTML(stop.name)}</div>`,
          ),
        )
        .addTo(map);
      markersRef.current.push(m);
    });

    winners.forEach((w) => {
      const color = w.category ? CATEGORY_COLOR[w.category] : "#94a3b8";
      const el = document.createElement("div");
      Object.assign(el.style, {
        background: color,
        width: "16px",
        height: "16px",
        borderRadius: "999px",
        border: "2.5px solid #faf6ef",
        boxShadow: "0 4px 12px -2px rgba(42,37,32,0.55), 0 0 0 1px rgba(42,37,32,0.18)",
        cursor: "pointer",
      } as Partial<CSSStyleDeclaration>);
      const m = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([w.lng, w.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 14, closeButton: false }).setHTML(
            `<div style="font-weight: 600; font-size: 13px;">${escapeHTML(w.name)}</div>`,
          ),
        )
        .addTo(map);
      markersRef.current.push(m);
    });

    const pts = [
      ...bundle.stops.map((s) => [s.lng, s.lat] as [number, number]),
      ...winners.map((w) => [w.lng, w.lat] as [number, number]),
    ];
    if (pts.length >= 2) {
      const bounds = pts.reduce(
        (b, p) => b.extend(p),
        new mapboxgl.LngLatBounds(pts[0], pts[0]),
      );
      map.fitBounds(bounds, { padding: 90, duration: 1400, maxZoom: 9 });
    } else if (pts.length === 1) {
      map.flyTo({ center: pts[0], zoom: 8, duration: 1200 });
    }
  }, [bundle.stops, winners, activeStopId, onStopClick]);

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
              ? { type: "Feature", geometry: data.route.geometry, properties: {} }
              : { type: "FeatureCollection", features: [] },
          );
        };
        if (map.isStyleLoaded()) apply();
        else map.once("load", apply);
      })
      .catch(() => {});
  }, [bundle.stops]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !activeStopId) return;
    const stop = bundle.stops.find((s) => s.id === activeStopId);
    if (!stop) return;
    map.flyTo({ center: [stop.lng, stop.lat], zoom: 9, duration: 1400, essential: true });
  }, [activeStopId, bundle.stops]);

  return <div ref={ref} className="absolute inset-0" />;
}

function escapeHTML(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}
