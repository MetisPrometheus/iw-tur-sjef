import { NextResponse } from "next/server";
import { searchNearby } from "@/lib/places";
import { SLOT_PLACE_TYPE, type SlotKind } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const lat = Number(u.searchParams.get("lat"));
  const lng = Number(u.searchParams.get("lng"));
  const kind = u.searchParams.get("kind") as SlotKind | null;
  const keyword = u.searchParams.get("q") ?? undefined;
  const radius = u.searchParams.get("radius")
    ? Number(u.searchParams.get("radius"))
    : undefined;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat/lng required" }, { status: 400 });
  }

  try {
    const places = await searchNearby({
      lat,
      lng,
      radius,
      includedType: keyword ? undefined : kind ? SLOT_PLACE_TYPE[kind] : undefined,
      keyword,
    });
    return NextResponse.json({ places });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "places error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
