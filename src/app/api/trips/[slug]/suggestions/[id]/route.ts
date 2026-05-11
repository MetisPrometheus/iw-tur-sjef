import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const { id } = await params;
  await sql`DELETE FROM suggestion WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
