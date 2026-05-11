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
        "flex gap-3 rounded-xl border bg-white p-3 shadow-card",
        isWinner ? "border-moss/70 ring-1 ring-moss/30" : "border-dust",
      )}
    >
      {suggestion.photo_ref ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/places/photo?ref=${encodeURIComponent(suggestion.photo_ref)}&w=240`}
          alt={suggestion.name}
          className="h-20 w-20 shrink-0 rounded-md object-cover"
        />
      ) : (
        <div className="h-20 w-20 shrink-0 rounded-md bg-sand" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {isWinner && (
                <span className="rounded-full bg-moss px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">
                  Winner
                </span>
              )}
              <a
                href={suggestion.url ?? "#"}
                target={suggestion.url ? "_blank" : undefined}
                rel="noreferrer"
                className={clsx(
                  "truncate text-sm font-semibold",
                  suggestion.url && "hover:underline",
                )}
              >
                {suggestion.name}
              </a>
            </div>
            {suggestion.address && (
              <div className="truncate text-[11px] text-ink/50">
                {suggestion.address}
              </div>
            )}
            {suggestion.note && (
              <div className="mt-1 text-xs italic text-ink/70">
                &ldquo;{suggestion.note}&rdquo;
              </div>
            )}
            <div className="mt-2 flex items-center gap-2 text-[11px] text-ink/50">
              {suggestion.rating != null && <span>★ {suggestion.rating.toFixed(1)}</span>}
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
                "flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
                myVote
                  ? "bg-ink text-cream"
                  : "border border-ink/20 bg-white hover:bg-sand/60",
              )}
            >
              <span>▲</span>
              <span>{votes.length}</span>
            </button>
            {meId === suggestion.added_by && (
              <button
                onClick={remove}
                className="text-[10px] text-ink/40 hover:text-rust"
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
