// Server-side Google Places (New) client. Key never reaches the browser.

const KEY = process.env.GOOGLE_PLACES_API_KEY;

export type NearbyPlace = {
  place_id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  rating: number | null;
  user_ratings_total: number | null;
  photo_ref: string | null;
  types: string[];
  url: string | null;
  price_level: number | null;
};

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.photos",
  "places.types",
  "places.googleMapsUri",
  "places.priceLevel",
].join(",");

export async function searchNearby(opts: {
  lat: number;
  lng: number;
  radius?: number;
  includedType?: string;
  keyword?: string;
}): Promise<NearbyPlace[]> {
  if (!KEY) throw new Error("GOOGLE_PLACES_API_KEY missing");

  const body: Record<string, unknown> = {
    maxResultCount: 20,
    locationRestriction: {
      circle: {
        center: { latitude: opts.lat, longitude: opts.lng },
        radius: Math.min(opts.radius ?? 3000, 50000),
      },
    },
  };
  if (opts.includedType) body.includedTypes = [opts.includedType];
  if (opts.keyword) body.textQuery = opts.keyword;

  const url = opts.keyword
    ? "https://places.googleapis.com/v1/places:searchText"
    : "https://places.googleapis.com/v1/places:searchNearby";

  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": KEY,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Places API ${r.status}: ${t}`);
  }
  const data = (await r.json()) as { places?: GooglePlace[] };
  return (data.places ?? []).map(normalize);
}

type GooglePlace = {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  photos?: { name: string }[];
  types?: string[];
  googleMapsUri?: string;
  priceLevel?: string;
};

const PRICE: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

function normalize(p: GooglePlace): NearbyPlace {
  return {
    place_id: p.id,
    name: p.displayName?.text ?? "Untitled place",
    address: p.formattedAddress ?? null,
    lat: p.location?.latitude ?? 0,
    lng: p.location?.longitude ?? 0,
    rating: p.rating ?? null,
    user_ratings_total: p.userRatingCount ?? null,
    photo_ref: p.photos?.[0]?.name ?? null,
    types: p.types ?? [],
    url: p.googleMapsUri ?? null,
    price_level: p.priceLevel ? PRICE[p.priceLevel] ?? null : null,
  };
}

export function photoUrl(photoRef: string, maxWidth = 640): string {
  // photoRef is the full resource name e.g. "places/XYZ/photos/ABC"
  return `https://places.googleapis.com/v1/${photoRef}/media?maxWidthPx=${maxWidth}&key=${KEY}`;
}
