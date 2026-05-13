import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import type { Stop, Trip } from "@/lib/types";

export const dynamic = "force-dynamic";

const Body = z.object({
  name: z.string().trim().min(1).max(120),
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const trips = await sql<Trip[]>`SELECT id FROM trip WHERE slug = ${slug}`;
  if (!trips.length) return NextResponse.json({ error: "not found" }, { status: 404 });
  const tripId = trips[0].id;

  const max = await sql<{ m: number | null }[]>`
    SELECT MAX(order_index) AS m FROM stop WHERE trip_id = ${tripId}
  `;
  const order = (max[0].m ?? -1) + 1;

  const rows = await sql<Stop[]>`
    INSERT INTO stop (trip_id, order_index, name, lat, lng, start_date, end_date)
    VALUES (${tripId}, ${order}, ${parsed.data.name}, ${parsed.data.lat}, ${parsed.data.lng},
            ${parsed.data.start_date ?? null}, ${parsed.data.end_date ?? null})
    RETURNING *
  `;
  await sql`UPDATE trip SET updated_at = now() WHERE id = ${tripId}`;
  return NextResponse.json(rows[0]);
}
