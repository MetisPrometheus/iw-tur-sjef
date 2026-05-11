import { NextResponse } from "next/server";
import { drivingRoute } from "@/lib/mapbox";

export const dynamic = "force-dynamic";

// Body: { coords: [{lat, lng}, ...] }
export async function POST(req: Request) {
  const json = (await req.json().catch(() => null)) as {
    coords?: { lat: number; lng: number }[];
  } | null;
  if (!json?.coords || json.coords.length < 2) {
    return NextResponse.json({ route: null });
  }
  try {
    const route = await drivingRoute(json.coords);
    return NextResponse.json({ route });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "directions error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
