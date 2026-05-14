import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import type { Expense, ExpenseSplit } from "@/lib/types";

export const dynamic = "force-dynamic";

const Body = z.object({
  suggestion_id: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().trim().min(1).max(8).default("NOK"),
  paid_by: z.string().uuid(),
  split_kind: z.enum(["equal", "amounts"]),
  splits: z
    .array(z.object({ participant_id: z.string().uuid(), amount: z.number().nonnegative() }))
    .min(1),
  note: z.string().trim().max(280).nullable().optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const d = parsed.data;

  // Validate splits sum ~ amount (allow ±0.05 tolerance).
  const sum = d.splits.reduce((acc, s) => acc + Number(s.amount), 0);
  if (Math.abs(sum - d.amount) > 0.05) {
    return NextResponse.json(
      { error: `split total ${sum} doesn't match amount ${d.amount}` },
      { status: 400 },
    );
  }

  const result = await sql.begin(async (tx) => {
    const inserted = await tx<Expense[]>`
      INSERT INTO expense (suggestion_id, amount, currency, paid_by, split_kind, note)
      VALUES (${d.suggestion_id}, ${d.amount}, ${d.currency}, ${d.paid_by}, ${d.split_kind}, ${d.note ?? null})
      RETURNING *
    `;
    const expense = inserted[0];
    const splits: ExpenseSplit[] = [];
    for (const s of d.splits) {
      const r = await tx<ExpenseSplit[]>`
        INSERT INTO expense_split (expense_id, participant_id, amount)
        VALUES (${expense.id}, ${s.participant_id}, ${s.amount})
        RETURNING *
      `;
      splits.push(r[0]);
    }
    return { expense, splits };
  });

  return NextResponse.json(result);
}
