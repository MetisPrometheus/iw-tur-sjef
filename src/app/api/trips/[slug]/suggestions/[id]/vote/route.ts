import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

const Body = z.object({ participant_id: z.string().uuid() });

// Toggle: insert if missing, remove if present. Returns { voted: boolean }.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const pid = parsed.data.participant_id;

  const existing = await sql<{ id: string }[]>`
    SELECT id FROM vote WHERE suggestion_id = ${id} AND participant_id = ${pid}
  `;
  if (existing.length) {
    await sql`DELETE FROM vote WHERE id = ${existing[0].id}`;
    return NextResponse.json({ voted: false });
  }
  await sql`INSERT INTO vote (suggestion_id, participant_id) VALUES (${id}, ${pid})`;
  return NextResponse.json({ voted: true });
}
