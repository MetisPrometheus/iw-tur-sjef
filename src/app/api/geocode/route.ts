import { NextResponse } from "next/server";
import { geocodeForward } from "@/lib/mapbox";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q");
  if (!q) return NextResponse.json({ hits: [] });
  try {
    const hits = await geocodeForward(q);
    return NextResponse.json({ hits });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "geocode error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
