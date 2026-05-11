import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import type { DaySlot } from "@/lib/types";

export const dynamic = "force-dynamic";

const Patch = z.object({
  label: z.string().trim().max(60).nullable().optional(),
  capacity: z.number().int().min(1).max(10).optional(),
  time_start: z.string().nullable().optional(),
  time_end: z.string().nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = Patch.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const d = parsed.data;

  const rows = await sql<DaySlot[]>`
    UPDATE day_slot SET
      label = COALESCE(${d.label ?? null}, label),
      capacity = COALESCE(${d.capacity ?? null}, capacity),
      time_start = COALESCE(${d.time_start ?? null}, time_start),
      time_end = COALESCE(${d.time_end ?? null}, time_end)
    WHERE id = ${id} RETURNING *
  `;
  if (!rows.length) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const { id } = await params;
  await sql`DELETE FROM day_slot WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
