"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import type { Participant, Suggestion } from "@/lib/types";
import { CATEGORY_COLOR, CATEGORY_EMOJI } from "@/lib/types";

export default function AddExpenseModal({
  suggestion,
  participants,
  defaultPaidBy,
  slug,
  onClose,
  onSaved,
}: {
  suggestion: Suggestion;
  participants: Participant[];
  defaultPaidBy: string | null;
  slug: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("NOK");
  const [paidBy, setPaidBy] = useState<string | null>(
    defaultPaidBy ?? participants[0]?.id ?? null,
  );
  const [splitKind, setSplitKind] = useState<"equal" | "amounts">("equal");
  const [included, setIncluded] = useState<Set<string>>(
    new Set(participants.map((p) => p.id)),
  );
  const [custom, setCustom] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const total = Number(amount);
  const validAmount = Number.isFinite(total) && total > 0;

  useEffect(() => {
    if (!validAmount || splitKind !== "amounts") return;
    // Pre-fill custom to even split if currently empty.
    const arr = participants.filter((p) => included.has(p.id));
    if (arr.length === 0) return;
    const even = total / arr.length;
    setCustom((c) => {
      const next: Record<string, string> = { ...c };
      for (const p of arr) {
        if (!next[p.id] || next[p.id] === "") next[p.id] = even.toFixed(2);
      }
      return next;
    });
  }, [splitKind, validAmount, total, participants, included]);

  function toggleIncluded(id: string) {
    const next = new Set(included);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setIncluded(next);
  }

  function computeSplits(): { participant_id: string; amount: number }[] {
    if (splitKind === "equal") {
      const arr = participants.filter((p) => included.has(p.id));
      if (arr.length === 0) return [];
      const each = total / arr.length;
      // Distribute pennies to first participant.
      const rounded = arr.map(() => Math.round(each * 100) / 100);
      const diff = Math.round((total - rounded.reduce((a, b) => a + b, 0)) * 100) / 100;
      rounded[0] = Math.round((rounded[0] + diff) * 100) / 100;
      return arr.map((p, i) => ({ participant_id: p.id, amount: rounded[i] }));
    }
    return participants
      .filter((p) => custom[p.id] && Number(custom[p.id]) > 0)
      .map((p) => ({
        participant_id: p.id,
        amount: Number(custom[p.id]),
      }));
  }

  async function save() {
    setErr(null);
    if (!validAmount) {
      setErr("Enter an amount");
      return;
    }
    if (!paidBy) {
      setErr("Pick who paid");
      return;
    }
    const splits = computeSplits();
    if (splits.length === 0) {
      setErr("At least one person needs to be in the split");
      return;
    }
    const sum = splits.reduce((a, b) => a + b.amount, 0);
    if (Math.abs(sum - total) > 0.05) {
      setErr(`Splits add to ${sum.toFixed(2)} — must equal ${total.toFixed(2)}`);
      return;
    }
    setBusy(true);
    const r = await fetch(`/api/trips/${slug}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        suggestion_id: suggestion.id,
        amount: total,
        currency,
        paid_by: paidBy,
        split_kind: splitKind,
        splits,
        note: note.trim() || null,
      }),
    });
    setBusy(false);
    if (!r.ok) {
      setErr(await r.text());
      return;
    }
    onSaved();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 backdrop-blur-sm animate-fade-in sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full flex-col rounded-t-4xl bg-cream shadow-lift animate-slide-up sm:max-w-md sm:rounded-4xl"
        style={{ paddingBottom: "max(1rem, var(--safe-bottom))" }}
      >
        <div className="flex justify-center pt-2 pb-1 sm:hidden">
          <span className="h-1 w-10 rounded-full bg-line" />
        </div>
        <div className="flex items-start justify-between gap-3 px-5 pt-3 pb-3 sm:pt-5">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg text-white"
              style={{ background: CATEGORY_COLOR[suggestion.category] }}
            >
              {CATEGORY_EMOJI[suggestion.category]}
            </span>
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                Log a spend at
              </div>
              <h2 className="truncate font-serif text-lg font-semibold tracking-tight">
                {suggestion.name}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-sand text-ink transition active:scale-[0.92] hover:bg-line"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            Amount
          </div>
          <div className="mt-1 flex gap-2">
            <input
              autoFocus
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="min-w-0 flex-1 rounded-2xl border border-line bg-cream px-4 py-3 text-2xl font-serif font-semibold outline-none focus:border-rust"
            />
            <input
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase().slice(0, 8))}
              className="w-20 rounded-2xl border border-line bg-cream px-3 py-3 text-center font-semibold uppercase outline-none focus:border-rust"
            />
          </div>

          <div className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            Paid by
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {participants.map((p) => (
              <button
                key={p.id}
                onClick={() => setPaidBy(p.id)}
                className={clsx(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition active:scale-[0.96]",
                  paidBy === p.id
                    ? "border-transparent text-white shadow-soft"
                    : "border-line bg-cream text-ink hover:border-ink",
                )}
                style={paidBy === p.id ? { background: p.color } : undefined}
              >
                <span
                  className={clsx(
                    "h-2 w-2 rounded-full",
                    paidBy === p.id && "bg-white/80",
                  )}
                  style={paidBy === p.id ? undefined : { background: p.color }}
                />
                <span>{p.display_name}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            Split how?
          </div>
          <div className="mt-1.5 flex gap-1.5">
            <SplitPill
              active={splitKind === "equal"}
              onClick={() => setSplitKind("equal")}
            >
              Equal
            </SplitPill>
            <SplitPill
              active={splitKind === "amounts"}
              onClick={() => setSplitKind("amounts")}
            >
              By amount
            </SplitPill>
          </div>

          <ul className="mt-2 flex flex-col gap-1.5">
            {participants.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-2 rounded-xl border border-line bg-cream px-3 py-2"
              >
                <span
                  className="inline-block h-3 w-3 shrink-0 rounded-full"
                  style={{ background: p.color }}
                />
                <span className="flex-1 text-sm font-medium">{p.display_name}</span>
                {splitKind === "equal" ? (
                  <input
                    type="checkbox"
                    checked={included.has(p.id)}
                    onChange={() => toggleIncluded(p.id)}
                    className="h-4 w-4 accent-rust"
                  />
                ) : (
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={custom[p.id] ?? ""}
                    onChange={(e) =>
                      setCustom((c) => ({ ...c, [p.id]: e.target.value }))
                    }
                    placeholder="0"
                    className="w-24 rounded-lg border border-line bg-soft px-2 py-1 text-right text-sm outline-none focus:border-rust"
                  />
                )}
              </li>
            ))}
          </ul>

          <div className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            Note (optional)
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={280}
            placeholder="e.g. dinner Saturday"
            className="mt-1.5 w-full rounded-2xl border border-line bg-cream px-4 py-2.5 text-sm outline-none focus:border-rust"
          />

          {err && <div className="mt-3 text-sm text-rust">{err}</div>}
        </div>

        <div className="flex gap-2 border-t border-line px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-2xl border border-line bg-cream px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-sand"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={busy || !validAmount || !paidBy}
            className="flex-1 rounded-2xl bg-ink px-4 py-2.5 text-sm font-semibold text-cream transition active:scale-[0.98] disabled:opacity-40"
          >
            {busy ? "saving…" : `Save · ${validAmount ? total.toFixed(2) : "0"} ${currency}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function SplitPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "rounded-full px-3 py-1 text-xs font-semibold transition active:scale-[0.96]",
        active ? "bg-ink text-cream" : "bg-sand text-muted hover:bg-line hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
