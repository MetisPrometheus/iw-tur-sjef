import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { nextColor } from "@/lib/palette";
import type { Participant, Trip } from "@/lib/types";

export const dynamic = "force-dynamic";

const Body = z.object({
  client_id: z.string().uuid(),
  display_name: z.string().trim().min(1).max(30),
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

  const existing = await sql<Participant[]>`
    SELECT * FROM participant
    WHERE trip_id = ${tripId} AND client_id = ${parsed.data.client_id}
  `;
  if (existing.length) {
    // Allow rename on rejoin.
    const updated = await sql<Participant[]>`
      UPDATE participant SET display_name = ${parsed.data.display_name}
      WHERE id = ${existing[0].id} RETURNING *
    `;
    return NextResponse.json(updated[0]);
  }

  const taken = (
    await sql<{ color: string }[]>`SELECT color FROM participant WHERE trip_id = ${tripId}`
  ).map((r) => r.color);
  const color = nextColor(taken);

  const inserted = await sql<Participant[]>`
    INSERT INTO participant (trip_id, client_id, display_name, color)
    VALUES (${tripId}, ${parsed.data.client_id}, ${parsed.data.display_name}, ${color})
    RETURNING *
  `;
  return NextResponse.json(inserted[0]);
}
