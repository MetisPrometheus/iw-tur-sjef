import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import type { Stop } from "@/lib/types";

export const dynamic = "force-dynamic";

const Patch = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  order_index: z.number().int().min(0).optional(),
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
  const rows = await sql<Stop[]>`
    UPDATE stop SET
      name = COALESCE(${d.name ?? null}, name),
      start_date = COALESCE(${d.start_date ?? null}, start_date),
      end_date = COALESCE(${d.end_date ?? null}, end_date),
      order_index = COALESCE(${d.order_index ?? null}, order_index)
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
  await sql`DELETE FROM stop WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
