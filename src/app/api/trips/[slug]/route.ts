import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import type {
  Trip,
  Participant,
  Stop,
  Suggestion,
  TripBundle,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const trips = await sql<Trip[]>`SELECT * FROM trip WHERE slug = ${slug}`;
  if (!trips.length) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const trip = trips[0];

  const [participants, stops, suggestions] = await Promise.all([
    sql<Participant[]>`SELECT * FROM participant WHERE trip_id = ${trip.id} ORDER BY created_at`,
    sql<Stop[]>`SELECT * FROM stop WHERE trip_id = ${trip.id} ORDER BY order_index`,
    sql<Suggestion[]>`
      SELECT sg.* FROM suggestion sg
      JOIN stop st ON st.id = sg.stop_id
      WHERE st.trip_id = ${trip.id}
      ORDER BY sg.created_at
    `,
  ]);

  const bundle: TripBundle = { trip, participants, stops, suggestions };
  return NextResponse.json(bundle);
}

const Patch = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const json = await req.json().catch(() => null);
  const parsed = Patch.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const d = parsed.data;

  const rows = await sql<Trip[]>`
    UPDATE trip SET
      name = COALESCE(${d.name ?? null}, name),
      start_date = COALESCE(${d.start_date ?? null}, start_date),
      end_date = COALESCE(${d.end_date ?? null}, end_date),
      updated_at = now()
    WHERE slug = ${slug} RETURNING *
  `;
  if (!rows.length) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}
