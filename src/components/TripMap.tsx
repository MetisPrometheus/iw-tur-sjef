"use client";

import { useEffect, useMemo, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { TripBundle, Category } from "@/lib/types";
import { CATEGORY_COLOR, CATEGORY_EMOJI } from "@/lib/types";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

type Pinned = {
  id: string;
  stop_id: string;
  lat: number;
  lng: number;
  name: string;
  category: Category;
};

export default function TripMap({
  bundle,
  activeStopId,
  onStopClick,
  onPinClick,
}: {
  bundle: TripBundle;
  activeStopId?: string | null;
  onStopClick?: (stopId: string) => void;
  onPinClick?: (suggestionId: string) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const routeReqRef = useRef(0);

  const pins: Pinned[] = useMemo(
    () =>
      bundle.suggestions
        .filter(
          (s): s is typeof s & { lat: number; lng: number } =>
            s.is_pinned && s.lat != null && s.lng != null,
        )
        .map((s) => ({
          id: s.id,
          stop_id: s.stop_id,
          lat: s.lat,
          lng: s.lng,
          name: s.name,
          category: s.category,
        })),
    [bundle.suggestions],
  );

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const first = bundle.stops[0];
    const map = new mapboxgl.Map({
      container: ref.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      projection: { name: "globe" },
      center: first ? [first.lng, first.lat] : [10.75, 59.91],
      zoom: first ? 5.5 : 1.4,
      attributionControl: false,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-left");
    map.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      "bottom-right",
    );

    map.on("style.load", () => {
      map.setFog({
        color: "rgb(186, 210, 235)",
        "high-color": "rgb(36, 92, 223)",
        "horizon-blend": 0.04,
        "space-color": "rgb(11, 11, 25)",
        "star-intensity": 0.55,
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
          "line-color": "#fcd34d",
          "line-width": 10,
          "line-opacity": 0.25,
          "line-blur": 6,
        },
      });
      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#faf6ef",
          "line-width": 2.5,
          "line-opacity": 0.9,
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
          display: grid;
          place-items: center;
          width: ${isActive ? 46 : 38}px;
          height: ${isActive ? 46 : 38}px;
          border-radius: 999px;
          background: linear-gradient(135deg, #fcd34d 0%, #c4633c 95%);
          color: #2a2520;
          font-weight: 800;
          font-size: ${isActive ? 17 : 14}px;
          box-shadow:
            0 0 0 3px rgba(250,246,239,0.85),
            0 0 ${isActive ? 36 : 22}px ${isActive ? 9 : 6}px rgba(252,211,77,0.55),
            0 8px 18px -4px rgba(0,0,0,0.55);
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
          new mapboxgl.Popup({ offset: 26, closeButton: false }).setHTML(
            `<div style="font-family: var(--font-fraunces), serif; font-weight: 600; font-size: 14px;">${escapeHTML(stop.name)}</div>`,
          ),
        )
        .addTo(map);
      markersRef.current.push(m);
    });

    pins.forEach((p) => {
      const color = CATEGORY_COLOR[p.category];
      const emoji = CATEGORY_EMOJI[p.category];
      const el = document.createElement("button");
      el.type = "button";
      el.setAttribute("aria-label", p.name);
      el.style.cursor = "pointer";
      el.style.background = "transparent";
      el.style.border = "0";
      el.style.padding = "0";
      el.innerHTML = `
        <span style="
          display: grid;
          place-items: center;
          width: 30px;
          height: 30px;
          border-radius: 999px;
          background: ${color};
          color: white;
          font-size: 14px;
          box-shadow:
            0 0 0 2.5px rgba(250,246,239,0.9),
            0 4px 12px -2px rgba(0,0,0,0.55);
        ">${emoji}</span>
      `;
      if (onPinClick) {
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          onPinClick(p.id);
        });
      }
      const m = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([p.lng, p.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 18, closeButton: false }).setHTML(
            `<div style="font-weight: 600; font-size: 13px;">${escapeHTML(p.name)}</div>`,
          ),
        )
        .addTo(map);
      markersRef.current.push(m);
    });

    const pts = [
      ...bundle.stops.map((s) => [s.lng, s.lat] as [number, number]),
      ...pins.map((p) => [p.lng, p.lat] as [number, number]),
    ];
    if (pts.length >= 2 && !activeStopId) {
      const bounds = pts.reduce(
        (b, p) => b.extend(p),
        new mapboxgl.LngLatBounds(pts[0], pts[0]),
      );
      map.fitBounds(bounds, { padding: 90, duration: 1400, maxZoom: 9 });
    } else if (pts.length === 1) {
      map.flyTo({ center: pts[0], zoom: 9, duration: 1200 });
    }
  }, [bundle.stops, pins, activeStopId, onStopClick, onPinClick]);

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
    map.flyTo({
      center: [stop.lng, stop.lat],
      zoom: 12,
      duration: 1400,
      essential: true,
    });
  }, [activeStopId, bundle.stops]);

  return <div ref={ref} className="absolute inset-0" />;
}

function escapeHTML(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}
