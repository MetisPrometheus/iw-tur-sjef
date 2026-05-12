import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { newTripSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

const Body = z.object({
  name: z.string().trim().min(1).max(80),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = newTripSlug();
    const rows = await sql<{ id: string; slug: string }[]>`
      INSERT INTO trip (slug, name) VALUES (${slug}, ${parsed.data.name})
      ON CONFLICT (slug) DO NOTHING
      RETURNING id, slug
    `;
    if (rows.length) return NextResponse.json(rows[0]);
  }
  return NextResponse.json({ error: "slug collision" }, { status: 500 });
}
