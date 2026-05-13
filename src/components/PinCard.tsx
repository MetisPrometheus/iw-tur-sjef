"use client";

import clsx from "clsx";
import {
  CATEGORY_COLOR,
  CATEGORY_EMOJI,
  type Participant,
  type Suggestion,
} from "@/lib/types";

export default function PinCard({
  suggestion,
  participants,
  meId,
  slug,
  onMutated,
}: {
  suggestion: Suggestion;
  participants: Participant[];
  meId: string | null;
  slug: string;
  onMutated: () => void;
}) {
  const author = participants.find((p) => p.id === suggestion.added_by);
  const pinned = suggestion.is_pinned;
  const cat = suggestion.category;

  async function togglePin() {
    await fetch(`/api/trips/${slug}/suggestions/${suggestion.id}/pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_pinned: !pinned }),
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
    <article
      className={clsx(
        "relative flex w-[240px] shrink-0 flex-col overflow-hidden rounded-3xl border bg-cream shadow-soft transition",
        pinned ? "border-line" : "border-line opacity-55",
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
        <button
          onClick={togglePin}
          disabled={!meId}
          className={clsx(
            "absolute right-2.5 top-2.5 grid h-10 w-10 place-items-center rounded-full text-lg shadow-lift transition active:scale-[0.92]",
            pinned
              ? "bg-rust text-white"
              : "bg-cream/95 text-ink/60 backdrop-blur-md",
          )}
          aria-label={pinned ? "Remove from map" : "Add to map"}
          title={pinned ? "Pinned — tap to remove from map" : "Tap to pin to map"}
        >
          {pinned ? "★" : "☆"}
        </button>
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
        <div className="mt-auto flex items-center justify-between pt-2 text-[11px] text-muted">
          <div className="flex items-center gap-1.5">
            {suggestion.rating != null && (
              <span className="font-semibold text-ink">
                ★ {Number(suggestion.rating).toFixed(1)}
              </span>
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
          <button
            onClick={remove}
            className="text-[10px] text-muted hover:text-rust"
          >
            delete
          </button>
        </div>
      </div>
    </article>
  );
}
