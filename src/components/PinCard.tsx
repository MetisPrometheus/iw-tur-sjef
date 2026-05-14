"use client";

import { useState } from "react";
import clsx from "clsx";
import {
  CATEGORY_COLOR,
  CATEGORY_EMOJI,
  type Expense,
  type Participant,
  type Suggestion,
} from "@/lib/types";
import AddExpenseModal from "./AddExpenseModal";

export default function PinCard({
  suggestion,
  participants,
  expenses,
  meId,
  slug,
  onMutated,
}: {
  suggestion: Suggestion;
  participants: Participant[];
  expenses: Expense[];
  meId: string | null;
  slug: string;
  onMutated: () => void;
}) {
  const [expenseOpen, setExpenseOpen] = useState(false);
  const author = participants.find((p) => p.id === suggestion.added_by);
  const pinned = suggestion.is_pinned;
  const done = suggestion.is_done;
  const cat = suggestion.category;
  const totalSpend = expenses.reduce((acc, e) => acc + Number(e.amount), 0);
  const currency = expenses[0]?.currency ?? "NOK";

  async function togglePin() {
    await fetch(`/api/trips/${slug}/suggestions/${suggestion.id}/pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_pinned: !pinned }),
    });
    onMutated();
  }

  async function toggleDone() {
    await fetch(`/api/trips/${slug}/suggestions/${suggestion.id}/done`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_done: !done }),
    });
    onMutated();
  }

  async function remove(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Remove "${suggestion.name}"?`)) return;
    await fetch(`/api/trips/${slug}/suggestions/${suggestion.id}`, {
      method: "DELETE",
    });
    onMutated();
  }

  return (
    <>
      <article
        className={clsx(
          "relative flex w-[240px] shrink-0 flex-col overflow-hidden rounded-3xl border bg-cream shadow-soft transition md:w-full md:shrink",
          pinned ? "border-line" : "border-line opacity-55",
          done && "ring-2 ring-emerald-500/50",
        )}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-sand">
          {suggestion.photo_ref ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/places/photo?ref=${encodeURIComponent(suggestion.photo_ref)}&w=480`}
              alt={suggestion.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="grid h-full w-full place-items-center text-4xl"
              style={{ background: CATEGORY_COLOR[cat] + "22" }}
            >
              {CATEGORY_EMOJI[cat]}
            </div>
          )}
          <div className="absolute right-2 top-2 flex flex-col gap-1.5">
            <button
              onClick={togglePin}
              disabled={!meId}
              className={clsx(
                "grid h-9 w-9 place-items-center rounded-full text-base shadow-lift transition active:scale-[0.92]",
                pinned
                  ? "bg-rust text-white"
                  : "bg-cream/95 text-ink/60 backdrop-blur-md",
              )}
              aria-label={pinned ? "Remove from map" : "Add to map"}
              title={pinned ? "Pinned" : "Tap to pin"}
            >
              {pinned ? "★" : "☆"}
            </button>
            <button
              onClick={toggleDone}
              disabled={!meId}
              className={clsx(
                "grid h-9 w-9 place-items-center rounded-full text-sm font-bold shadow-lift transition active:scale-[0.92]",
                done
                  ? "bg-emerald-500 text-white"
                  : "bg-cream/95 text-ink/60 backdrop-blur-md",
              )}
              aria-label={done ? "Mark not done" : "Mark as done"}
              title={done ? "Actually went here" : "Tap when you've been here"}
            >
              ✓
            </button>
          </div>
          {done && (
            <span className="absolute left-2 top-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow">
              Went
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-3">
          <a
            href={suggestion.url ?? "#"}
            target={suggestion.url ? "_blank" : undefined}
            rel="noreferrer"
            className={clsx(
              "line-clamp-1 font-serif text-base font-semibold leading-tight tracking-tight",
              suggestion.url && "hover:underline",
            )}
          >
            {suggestion.name}
          </a>
          {suggestion.address && (
            <div className="mt-0.5 line-clamp-1 text-[11px] text-muted">
              {suggestion.address}
            </div>
          )}
          {suggestion.note && (
            <div className="mt-1.5 line-clamp-2 text-[12px] italic text-ink/75">
              &ldquo;{suggestion.note}&rdquo;
            </div>
          )}
          <div className="mt-auto flex items-center justify-between gap-1 pt-2 text-[11px] text-muted">
            <div className="flex items-center gap-1.5">
              {suggestion.rating != null && (
                <span className="font-semibold text-ink">
                  ★ {Number(suggestion.rating).toFixed(1)}
                </span>
              )}
              {author && (
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: author.color }}
                  title={author.display_name}
                />
              )}
              {totalSpend > 0 && (
                <span className="rounded-full bg-sand px-1.5 py-0.5 text-[10px] font-semibold text-ink">
                  {Math.round(totalSpend)} {currency}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setExpenseOpen(true)}
                disabled={!meId}
                className="rounded-full bg-sand px-2 py-1 text-[10px] font-semibold text-ink transition active:scale-[0.94] hover:bg-line disabled:opacity-40"
                title="Log spending"
              >
                💸
              </button>
              <button
                onClick={remove}
                className="text-[10px] text-muted hover:text-rust"
              >
                delete
              </button>
            </div>
          </div>
        </div>
      </article>

      {expenseOpen && (
        <AddExpenseModal
          suggestion={suggestion}
          participants={participants}
          defaultPaidBy={meId}
          slug={slug}
          onClose={() => setExpenseOpen(false)}
          onSaved={onMutated}
        />
      )}
    </>
  );
}
