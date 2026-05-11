import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { SLOT_KINDS, type DaySlot } from "@/lib/types";

export const dynamic = "force-dynamic";

const Body = z.object({
  stop_id: z.string().uuid(),
  date: z.string(),
  kind: z.enum(SLOT_KINDS as [string, ...string[]]),
  label: z.string().trim().max(60).nullable().optional(),
  capacity: z.number().int().min(1).max(10).default(1),
  time_start: z.string().nullable().optional(),
  time_end: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const d = parsed.data;

  const max = await sql<{ m: number | null }[]>`
    SELECT MAX(order_index) AS m FROM day_slot WHERE stop_id = ${d.stop_id} AND date = ${d.date}
  `;
  const order = (max[0].m ?? -1) + 1;

  const rows = await sql<DaySlot[]>`
    INSERT INTO day_slot (stop_id, date, kind, label, capacity, time_start, time_end, order_index)
    VALUES (${d.stop_id}, ${d.date}, ${d.kind}, ${d.label ?? null}, ${d.capacity},
            ${d.time_start ?? null}, ${d.time_end ?? null}, ${order})
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
