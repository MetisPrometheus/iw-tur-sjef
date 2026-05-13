import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { CATEGORIES, type Suggestion } from "@/lib/types";

export const dynamic = "force-dynamic";

const Body = z.object({
  stop_id: z.string().uuid(),
  added_by: z.string().uuid(),
  category: z.enum(CATEGORIES as [string, ...string[]]),
  is_pinned: z.boolean().optional(),
  place_id: z.string().nullable().optional(),
  name: z.string().trim().min(1).max(200),
  address: z.string().nullable().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  rating: z.number().nullable().optional(),
  photo_ref: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  note: z.string().trim().max(280).nullable().optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const d = parsed.data;

  const rows = await sql<Suggestion[]>`
    INSERT INTO suggestion (stop_id, added_by, category, is_pinned, place_id, name, address, lat, lng, rating, photo_ref, url, note)
    VALUES (${d.stop_id}, ${d.added_by}, ${d.category}, ${d.is_pinned ?? true},
            ${d.place_id ?? null}, ${d.name}, ${d.address ?? null},
            ${d.lat ?? null}, ${d.lng ?? null}, ${d.rating ?? null},
            ${d.photo_ref ?? null}, ${d.url ?? null}, ${d.note ?? null})
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
