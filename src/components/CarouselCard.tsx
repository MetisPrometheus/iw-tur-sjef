"use client";

import clsx from "clsx";
import {
  CATEGORY_COLOR,
  CATEGORY_EMOJI,
  CATEGORY_LABEL,
  type Category,
  type Participant,
  type Suggestion,
  type Vote,
} from "@/lib/types";

export default function CarouselCard({
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
  const cat = (suggestion.category as Category | null) ?? null;

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
    <article
      className={clsx(
        "relative flex w-[260px] shrink-0 flex-col overflow-hidden rounded-3xl border bg-cream shadow-soft transition sm:w-[280px]",
        isWinner ? "border-sage shadow-lift ring-2 ring-sage/40" : "border-line",
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-sand">
        {suggestion.photo_ref ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/places/photo?ref=${encodeURIComponent(suggestion.photo_ref)}&w=600`}
            alt={suggestion.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-3xl">
            {cat ? CATEGORY_EMOJI[cat] : "📍"}
          </div>
        )}
        {cat && (
          <span
            className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-cream/95 px-2 py-0.5 text-[10px] font-semibold backdrop-blur-md"
            style={{ color: CATEGORY_COLOR[cat] }}
          >
            <span className="text-xs leading-none">{CATEGORY_EMOJI[cat]}</span>
            <span>{CATEGORY_LABEL[cat]}</span>
          </span>
        )}
        {isWinner && (
          <span className="absolute left-3 bottom-3 rounded-full bg-sage px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow">
            Winner
          </span>
        )}
        <button
          onClick={toggleVote}
          disabled={!meId}
          className={clsx(
            "absolute right-3 top-3 grid h-10 min-w-[44px] place-items-center gap-0.5 rounded-full px-2 text-sm font-semibold shadow-lift transition active:scale-[0.92]",
            myVote
              ? "bg-rust text-white"
              : "bg-cream/95 text-ink backdrop-blur-md hover:bg-rust hover:text-white",
          )}
        >
          <span className="text-base leading-none">♥</span>
          <span className="text-xs">{votes.length}</span>
        </button>
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <a
          href={suggestion.url ?? "#"}
          target={suggestion.url ? "_blank" : undefined}
          rel="noreferrer"
          className={clsx(
            "font-serif text-base font-semibold leading-tight tracking-tight text-ink",
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
          <div className="mt-2 line-clamp-3 text-[12px] italic text-ink/75">
            &ldquo;{suggestion.note}&rdquo;
          </div>
        )}
        <div className="mt-auto flex items-center justify-between pt-3 text-[11px] text-muted">
          <div className="flex items-center gap-1.5">
            {suggestion.rating != null && (
              <span className="font-semibold text-ink">★ {suggestion.rating.toFixed(1)}</span>
            )}
            {author && (
              <span className="flex items-center gap-1">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: author.color }}
                />
                <span>{author.display_name}</span>
              </span>
            )}
          </div>
          {meId === suggestion.added_by && (
            <button
              onClick={remove}
              className="text-[10px] text-muted hover:text-rust"
            >
              remove
            </button>
          )}
        </div>
        {votes.length > 0 && (
          <div className="mt-1.5 flex -space-x-1">
            {votes.map((v) => {
              const p = participants.find((pp) => pp.id === v.participant_id);
              if (!p) return null;
              return (
                <span
                  key={v.id}
                  title={p.display_name}
                  className="grid h-4 w-4 place-items-center rounded-full border-2 border-cream text-[8px] font-semibold text-white"
                  style={{ background: p.color }}
                >
                  {p.display_name.slice(0, 1).toUpperCase()}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
}
