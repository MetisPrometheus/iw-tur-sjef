"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import mapboxgl from "mapbox-gl";
import type { TripBundle, Category } from "@/lib/types";
import { CATEGORY_COLOR, CATEGORY_EMOJI } from "@/lib/types";
import MapPopupContent, {
  type GhostPlace,
  type SelectedPin,
  type PopupAction,
} from "./MapPopupContent";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

export default function TripMap({
  bundle,
  ghosts,
  selectedPin,
  activeStopId,
  onSelectPin,
  onClosePopup,
  onAction,
}: {
  bundle: TripBundle;
  ghosts: GhostPlace[];
  selectedPin: SelectedPin | null;
  activeStopId: string | null;
  onSelectPin: (pin: SelectedPin) => void;
  onClosePopup: () => void;
  onAction: (a: PopupAction) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const routeReqRef = useRef(0);
  const [mapReady, setMapReady] = useState(false);

  // popup DOM target (React portal renders into this)
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [popupEl, setPopupEl] = useState<HTMLDivElement | null>(null);

  const pinnedSuggestions = useMemo(
    () =>
      bundle.suggestions.filter(
        (s): s is typeof s & { lat: number; lng: number } =>
          s.is_pinned && s.lat != null && s.lng != null,
      ),
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
          "line-color": "#c4633c",
          "line-width": 12,
          "line-opacity": 0.32,
          "line-blur": 8,
        },
      });
      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#c4633c",
          "line-width": 3.5,
          "line-opacity": 0.98,
          "line-dasharray": [0.6, 1.4],
        },
      });
      setMapReady(true);
    });

    // Tapping empty map clears the popup.
    map.on("click", () => {
      onClosePopup();
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render all markers (stops, saved, ghost).
  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Stop letter pins
    bundle.stops.forEach((stop, i) => {
      const letter = String.fromCharCode(65 + i);
      const isActive = stop.id === activeStopId;
      const el = stopMarkerElement(letter, isActive);
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectPin({ kind: "stop", stopId: stop.id });
      });
      const m = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([stop.lng, stop.lat])
        .addTo(map);
      markersRef.current.push(m);
    });

    // Saved pinned suggestions
    pinnedSuggestions.forEach((s) => {
      const el =
        s.category === "hotel"
          ? hotelMarkerElement()
          : savedMarkerElement(s.category);
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectPin({ kind: "saved", suggestionId: s.id });
      });
      const m = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([s.lng, s.lat])
        .addTo(map);
      markersRef.current.push(m);
    });

    // Ghost (browse-mode) pins
    ghosts.forEach((g) => {
      const el = ghostMarkerElement(g.category);
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectPin({ kind: "ghost", placeId: g.place_id });
      });
      const m = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([g.lng, g.lat])
        .addTo(map);
      markersRef.current.push(m);
    });
  }, [
    mapReady,
    bundle.stops,
    pinnedSuggestions,
    ghosts,
    activeStopId,
    onSelectPin,
  ]);

  // Fly to active stop — ONCE per change. Don't re-fly on bundle refresh.
  const lastFlownStop = useRef<string | null>(null);
  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    if (!map || !activeStopId) return;
    if (lastFlownStop.current === activeStopId) return;
    const stop = bundle.stops.find((s) => s.id === activeStopId);
    if (!stop) return;
    map.flyTo({
      center: [stop.lng, stop.lat],
      zoom: 12.2,
      duration: 1400,
      essential: true,
    });
    lastFlownStop.current = activeStopId;
  }, [mapReady, activeStopId, bundle.stops]);

  // Driving route between stops.
  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    if (!map) return;
    const coords = bundle.stops.map((s) => ({ lat: s.lat, lng: s.lng }));
    if (coords.length < 2) {
      const src = map.getSource("route") as mapboxgl.GeoJSONSource | undefined;
      src?.setData({ type: "FeatureCollection", features: [] });
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
        const src = map.getSource("route") as mapboxgl.GeoJSONSource | undefined;
        if (!src) return;
        src.setData(
          data.route
            ? { type: "Feature", geometry: data.route.geometry, properties: {} }
            : { type: "FeatureCollection", features: [] },
        );
      })
      .catch(() => {});
  }, [mapReady, bundle.stops]);

  // Manage popup lifecycle based on selectedPin.
  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    if (!map) return;
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }
    setPopupEl(null);
    if (!selectedPin) return;

    const coords = coordsForPin(selectedPin, bundle, ghosts);
    if (!coords) return;
    const el = document.createElement("div");
    popupRef.current = new mapboxgl.Popup({
      offset: anchorOffsetForPin(selectedPin),
      closeButton: false,
      closeOnClick: false,
      closeOnMove: false,
      anchor: "bottom",
      maxWidth: "280px",
    })
      .setDOMContent(el)
      .setLngLat(coords)
      .addTo(map);
    setPopupEl(el);
  }, [mapReady, selectedPin, bundle, ghosts]);

  return (
    <>
      <div ref={ref} className="absolute inset-0" />
      {popupEl && selectedPin
        ? createPortal(
            <MapPopupContent
              selectedPin={selectedPin}
              bundle={bundle}
              ghosts={ghosts}
              onAction={onAction}
              onClose={onClosePopup}
            />,
            popupEl,
          )
        : null}
    </>
  );
}

function coordsForPin(
  pin: SelectedPin,
  bundle: TripBundle,
  ghosts: GhostPlace[],
): [number, number] | null {
  if (pin.kind === "stop") {
    const s = bundle.stops.find((x) => x.id === pin.stopId);
    return s ? [s.lng, s.lat] : null;
  }
  if (pin.kind === "saved") {
    const s = bundle.suggestions.find((x) => x.id === pin.suggestionId);
    if (!s || s.lat == null || s.lng == null) return null;
    return [s.lng, s.lat];
  }
  if (pin.kind === "ghost") {
    const g = ghosts.find((x) => x.place_id === pin.placeId);
    return g ? [g.lng, g.lat] : null;
  }
  return null;
}

function anchorOffsetForPin(pin: SelectedPin): number {
  if (pin.kind === "stop") return 28;
  if (pin.kind === "saved") return 22;
  return 18;
}

function stopMarkerElement(letter: string, isActive: boolean): HTMLElement {
  const el = document.createElement("button");
  el.type = "button";
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
  return el;
}

function hotelMarkerElement(): HTMLElement {
  const el = document.createElement("button");
  el.type = "button";
  el.style.cursor = "pointer";
  el.style.background = "transparent";
  el.style.border = "0";
  el.style.padding = "0";
  el.setAttribute("aria-label", "Hotel");
  el.innerHTML = `
    <span style="
      display: grid;
      place-items: center;
      width: 38px;
      height: 38px;
      border-radius: 999px;
      background: #faf6ef;
      color: #10b981;
      font-size: 18px;
      box-shadow:
        0 0 0 3px #10b981,
        0 0 0 5px rgba(250,246,239,0.85),
        0 8px 18px -4px rgba(0,0,0,0.6);
    ">🛏️</span>
  `;
  return el;
}

function savedMarkerElement(category: Category): HTMLElement {
  const el = document.createElement("button");
  el.type = "button";
  el.style.cursor = "pointer";
  el.style.background = "transparent";
  el.style.border = "0";
  el.style.padding = "0";
  el.setAttribute("aria-label", category);
  el.innerHTML = `
    <span style="
      display: grid;
      place-items: center;
      width: 28px;
      height: 28px;
      border-radius: 999px;
      background: ${CATEGORY_COLOR[category]};
      color: #fff;
      font-size: 13px;
      box-shadow:
        0 0 0 2.5px rgba(250,246,239,0.9),
        0 4px 12px -2px rgba(0,0,0,0.55);
    ">${CATEGORY_EMOJI[category]}</span>
  `;
  return el;
}

function ghostMarkerElement(category: Category): HTMLElement {
  const el = document.createElement("button");
  el.type = "button";
  el.style.cursor = "pointer";
  el.style.background = "transparent";
  el.style.border = "0";
  el.style.padding = "0";
  el.setAttribute("aria-label", "Browse result");
  const color = CATEGORY_COLOR[category];
  el.innerHTML = `
    <span style="
      display: grid;
      place-items: center;
      width: 24px;
      height: 24px;
      border-radius: 999px;
      background: rgba(250,246,239,0.96);
      color: ${color};
      font-size: 12px;
      border: 2px solid ${color};
      box-shadow: 0 4px 10px -2px rgba(0,0,0,0.45);
      opacity: 0.92;
    ">${CATEGORY_EMOJI[category]}</span>
  `;
  return el;
}
