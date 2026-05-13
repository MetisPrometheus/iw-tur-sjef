import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { newTripSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

const Body = z.object({
  name: z.string().trim().min(1).max(80),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  boss_client_id: z.string().uuid().nullable().optional(),
  destination: z
    .object({
      name: z.string().trim().min(1).max(120),
      lat: z.number().gte(-90).lte(90),
      lng: z.number().gte(-180).lte(180),
    })
    .nullable()
    .optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const { name, start_date, end_date, boss_client_id, destination } = parsed.data;

  let createdSlug: string | null = null;
  let tripId: string | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = newTripSlug();
    const rows = await sql<{ id: string; slug: string }[]>`
      INSERT INTO trip (slug, name, start_date, end_date, boss_client_id)
      VALUES (${slug}, ${name}, ${start_date ?? null}, ${end_date ?? null}, ${boss_client_id ?? null})
      ON CONFLICT (slug) DO NOTHING
      RETURNING id, slug
    `;
    if (rows.length) {
      createdSlug = rows[0].slug;
      tripId = rows[0].id;
      break;
    }
  }
  if (!createdSlug || !tripId) {
    return NextResponse.json({ error: "slug collision" }, { status: 500 });
  }

  // Seed the first stop if a destination was provided.
  if (destination) {
    await sql`
      INSERT INTO stop (trip_id, order_index, name, lat, lng, start_date, end_date)
      VALUES (${tripId}, 0, ${destination.name}, ${destination.lat}, ${destination.lng},
              ${start_date ?? null}, ${end_date ?? null})
    `;
  }

  return NextResponse.json({ id: tripId, slug: createdSlug });
}
