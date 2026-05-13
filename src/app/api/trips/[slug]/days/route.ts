import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import type { Day } from "@/lib/types";

export const dynamic = "force-dynamic";

const Body = z.object({
  stop_id: z.string().uuid(),
  date: z.string(),
  label: z.string().trim().max(60).nullable().optional(),
  capacity: z.number().int().min(1).max(20).default(5),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const d = parsed.data;

  // Upsert: one day per (stop, date).
  const rows = await sql<Day[]>`
    INSERT INTO day (stop_id, date, label, capacity)
    VALUES (${d.stop_id}, ${d.date}, ${d.label ?? null}, ${d.capacity})
    ON CONFLICT (stop_id, date) DO UPDATE
      SET label = COALESCE(EXCLUDED.label, day.label),
          capacity = EXCLUDED.capacity
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
