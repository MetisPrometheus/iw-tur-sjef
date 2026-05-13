import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import type {
  Trip,
  Participant,
  Stop,
  Day,
  Suggestion,
  Vote,
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

  const [participants, stops, days, suggestions, votes] = await Promise.all([
    sql<Participant[]>`SELECT * FROM participant WHERE trip_id = ${trip.id} ORDER BY created_at`,
    sql<Stop[]>`SELECT * FROM stop WHERE trip_id = ${trip.id} ORDER BY order_index`,
    sql<Day[]>`
      SELECT d.* FROM day d
      JOIN stop st ON st.id = d.stop_id
      WHERE st.trip_id = ${trip.id}
      ORDER BY d.date
    `,
    sql<Suggestion[]>`
      SELECT sg.* FROM suggestion sg
      JOIN day d ON d.id = sg.day_id
      JOIN stop st ON st.id = d.stop_id
      WHERE st.trip_id = ${trip.id}
      ORDER BY sg.created_at
    `,
    sql<Vote[]>`
      SELECT v.* FROM vote v
      JOIN suggestion sg ON sg.id = v.suggestion_id
      JOIN day d ON d.id = sg.day_id
      JOIN stop st ON st.id = d.stop_id
      WHERE st.trip_id = ${trip.id}
    `,
  ]);

  const bundle: TripBundle = { trip, participants, stops, days, suggestions, votes };
  return NextResponse.json(bundle);
}

const Patch = z.object({ name: z.string().trim().min(1).max(80) });

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const json = await req.json().catch(() => null);
  const parsed = Patch.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const rows = await sql<Trip[]>`
    UPDATE trip SET name = ${parsed.data.name}, updated_at = now()
    WHERE slug = ${slug} RETURNING *
  `;
  if (!rows.length) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}
