import { NextResponse } from "next/server";
import { searchNearby } from "@/lib/places";
import { CATEGORY_PLACE_TYPE, type Category } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const lat = Number(u.searchParams.get("lat"));
  const lng = Number(u.searchParams.get("lng"));
  const category = u.searchParams.get("category") as Category | null;
  const keyword = u.searchParams.get("q") ?? undefined;
  const radius = u.searchParams.get("radius")
    ? Number(u.searchParams.get("radius"))
    : undefined;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat/lng required" }, { status: 400 });
  }

  try {
    const includedType =
      !keyword && category ? CATEGORY_PLACE_TYPE[category] : undefined;
    const places = await searchNearby({
      lat,
      lng,
      radius,
      includedType,
      keyword,
    });
    return NextResponse.json({ places });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "places error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
