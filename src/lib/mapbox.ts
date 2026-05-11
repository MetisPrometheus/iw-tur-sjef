// Mapbox Geocoding (forward, for stop entry) + Directions (for the road route).
// Public token; we still proxy through the server for Directions to avoid
// hammering the browser when there are many stops, but Geocoding is fine
// client-side via the public token if we ever need it.

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export type GeocodeHit = {
  name: string;
  place_name: string;
  lat: number;
  lng: number;
};

export async function geocodeForward(query: string): Promise<GeocodeHit[]> {
  if (!TOKEN) throw new Error("NEXT_PUBLIC_MAPBOX_TOKEN missing");
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
    query,
  )}.json?limit=5&access_token=${TOKEN}`;
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`Mapbox geocode ${r.status}`);
  const data = (await r.json()) as {
    features: { text: string; place_name: string; center: [number, number] }[];
  };
  return data.features.map((f) => ({
    name: f.text,
    place_name: f.place_name,
    lng: f.center[0],
    lat: f.center[1],
  }));
}

export type RouteResult = {
  geometry: GeoJSON.LineString;
  distance_m: number;
  duration_s: number;
};

export async function drivingRoute(
  coords: { lat: number; lng: number }[],
): Promise<RouteResult | null> {
  if (!TOKEN) throw new Error("NEXT_PUBLIC_MAPBOX_TOKEN missing");
  if (coords.length < 2) return null;
  // Directions API caps at 25 coordinates per request.
  const trimmed = coords.slice(0, 25);
  const path = trimmed.map((c) => `${c.lng},${c.lat}`).join(";");
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${path}?geometries=geojson&overview=full&access_token=${TOKEN}`;
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`Mapbox directions ${r.status}`);
  const data = (await r.json()) as {
    routes: { geometry: GeoJSON.LineString; distance: number; duration: number }[];
  };
  const route = data.routes?.[0];
  if (!route) return null;
  return {
    geometry: route.geometry,
    distance_m: route.distance,
    duration_s: route.duration,
  };
}
