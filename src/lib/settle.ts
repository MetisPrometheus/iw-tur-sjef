import type { Expense, ExpenseSplit, Participant } from "@/lib/types";

export type Balance = {
  participant_id: string;
  paid: number;
  owes: number;
  net: number; // positive = is owed; negative = owes
};

export type Transfer = {
  from: string; // participant_id who owes
  to: string;   // participant_id who is owed
  amount: number;
};

export function balances(
  participants: Participant[],
  expenses: Expense[],
  splits: ExpenseSplit[],
): Balance[] {
  const paidBy = new Map<string, number>();
  for (const e of expenses) {
    paidBy.set(e.paid_by, (paidBy.get(e.paid_by) ?? 0) + Number(e.amount));
  }
  const owedBy = new Map<string, number>();
  for (const s of splits) {
    owedBy.set(
      s.participant_id,
      (owedBy.get(s.participant_id) ?? 0) + Number(s.amount),
    );
  }
  return participants.map((p) => {
    const paid = paidBy.get(p.id) ?? 0;
    const owes = owedBy.get(p.id) ?? 0;
    return { participant_id: p.id, paid, owes, net: paid - owes };
  });
}

// Greedy minimum-transactions settlement.
export function settle(bs: Balance[]): Transfer[] {
  const debtors = bs
    .filter((b) => b.net < -0.005)
    .map((b) => ({ id: b.participant_id, amt: -b.net }));
  const creditors = bs
    .filter((b) => b.net > 0.005)
    .map((b) => ({ id: b.participant_id, amt: b.net }));
  debtors.sort((a, b) => b.amt - a.amt);
  creditors.sort((a, b) => b.amt - a.amt);
  const out: Transfer[] = [];
  let i = 0,
    j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amt, creditors[j].amt);
    out.push({ from: debtors[i].id, to: creditors[j].id, amount: round2(pay) });
    debtors[i].amt -= pay;
    creditors[j].amt -= pay;
    if (debtors[i].amt < 0.005) i++;
    if (creditors[j].amt < 0.005) j++;
  }
  return out;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
