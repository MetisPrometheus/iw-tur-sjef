import { NextResponse } from "next/server";
import { photoUrl } from "@/lib/places";

export const dynamic = "force-dynamic";

// Redirect to the actual Google Places photo URL so the key stays server-side.
export async function GET(req: Request) {
  const u = new URL(req.url);
  const ref = u.searchParams.get("ref");
  const w = Number(u.searchParams.get("w") ?? "640");
  if (!ref) return NextResponse.json({ error: "ref required" }, { status: 400 });
  return NextResponse.redirect(photoUrl(ref, w));
}
