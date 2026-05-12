"use client";

import clsx from "clsx";
import type { Suggestion, Vote, Participant } from "@/lib/types";

export default function SuggestionCard({
  suggestion,
  votes,
  participants,
  meId,
  slug,
  isWinner,
  onMutated,
}: {
  suggestion: Suggestion;
  votes: Vote[];
  participants: Participant[];
  meId: string | null;
  slug: string;
  isWinner: boolean;
  onMutated: () => void;
}) {
  const author = participants.find((p) => p.id === suggestion.added_by);
  const myVote = meId ? votes.some((v) => v.participant_id === meId) : false;

  async function toggleVote() {
    if (!meId) return;
    await fetch(`/api/trips/${slug}/suggestions/${suggestion.id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participant_id: meId }),
    });
    onMutated();
  }

  async function remove() {
    if (!confirm("Remove this suggestion?")) return;
    await fetch(`/api/trips/${slug}/suggestions/${suggestion.id}`, {
      method: "DELETE",
    });
    onMutated();
  }

  return (
    <li
      className={clsx(
        "flex gap-3 rounded-xl border bg-white p-3 shadow-card transition",
        isWinner ? "border-brand ring-2 ring-brand/30" : "border-line",
      )}
    >
      {suggestion.photo_ref ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/places/photo?ref=${encodeURIComponent(suggestion.photo_ref)}&w=240`}
          alt={suggestion.name}
          className="h-20 w-20 shrink-0 rounded-md object-cover sm:h-24 sm:w-24"
        />
      ) : (
        <div className="h-20 w-20 shrink-0 rounded-md bg-soft sm:h-24 sm:w-24" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {isWinner && (
                <span className="rounded-full bg-brand px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                  Winner
                </span>
              )}
              <a
                href={suggestion.url ?? "#"}
                target={suggestion.url ? "_blank" : undefined}
                rel="noreferrer"
                className={clsx(
                  "truncate text-sm font-semibold sm:text-base",
                  suggestion.url && "hover:underline",
                )}
              >
                {suggestion.name}
              </a>
            </div>
            {suggestion.address && (
              <div className="truncate text-[11px] text-muted">
                {suggestion.address}
              </div>
            )}
            {suggestion.note && (
              <div className="mt-1 text-xs italic text-slate-600">
                &ldquo;{suggestion.note}&rdquo;
              </div>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted">
              {suggestion.rating != null && (
                <span className="font-medium text-ink">
                  ★ {suggestion.rating.toFixed(1)}
                </span>
              )}
              {author && (
                <span className="flex items-center gap-1">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: author.color }}
                  />
                  {author.display_name}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={toggleVote}
              disabled={!meId}
              className={clsx(
                "flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                myVote
                  ? "bg-ink text-white"
                  : "border border-line bg-white text-ink hover:border-brand hover:bg-brand-tint hover:text-brand-dark",
              )}
            >
              <span>▲</span>
              <span>{votes.length}</span>
            </button>
            {meId === suggestion.added_by && (
              <button
                onClick={remove}
                className="text-[10px] text-slate-400 hover:text-rose-600"
              >
                remove
              </button>
            )}
          </div>
        </div>
        {votes.length > 0 && (
          <div className="mt-2 flex -space-x-1">
            {votes.map((v) => {
              const p = participants.find((pp) => pp.id === v.participant_id);
              if (!p) return null;
              return (
                <span
                  key={v.id}
                  title={p.display_name}
                  className="grid h-5 w-5 place-items-center rounded-full border-2 border-white text-[8px] font-semibold text-white"
                  style={{ background: p.color }}
                >
                  {p.display_name.slice(0, 1).toUpperCase()}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </li>
  );
}
