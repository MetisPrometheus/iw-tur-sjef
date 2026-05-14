"use client";

import clsx from "clsx";
import {
  CATEGORY_COLOR,
  CATEGORY_EMOJI,
  CATEGORY_LABEL,
  type Category,
} from "@/lib/types";
import type { GhostPlace } from "./MapPopupContent";

export default function BrowsePanel({
  category,
  anchorName,
  loading,
  places,
  onAdd,
  onFocusOnMap,
}: {
  category: Category;
  anchorName: string;
  loading: boolean;
  places: GhostPlace[];
  onAdd: (p: GhostPlace) => void;
  onFocusOnMap: (placeId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 px-4 pb-4">
      <div className="rounded-3xl border border-line bg-cream/60 p-3.5">
        <div className="flex items-center gap-2">
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-xl text-white"
            style={{ background: CATEGORY_COLOR[category] }}
          >
            {CATEGORY_EMOJI[category]}
          </span>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
              Top {loading ? "…" : places.length} {CATEGORY_LABEL[category].toLowerCase()}
            </div>
            <div className="truncate font-serif text-base font-semibold">
              near {anchorName}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center rounded-3xl border border-dashed border-line bg-cream/40 px-4 py-10 text-sm text-muted">
          loading nearby places…
        </div>
      ) : places.length === 0 ? (
        <div className="grid place-items-center rounded-3xl border border-dashed border-line bg-cream/40 px-4 py-10 text-sm text-muted">
          no results — try a different search
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
          {places.map((p, i) => (
            <BrowseCard
              key={p.place_id}
              place={p}
              rank={i + 1}
              category={category}
              onAdd={() => onAdd(p)}
              onFocus={() => onFocusOnMap(p.place_id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function BrowseCard({
  place,
  rank,
  category,
  onAdd,
  onFocus,
}: {
  place: GhostPlace;
  rank: number;
  category: Category;
  onAdd: () => void;
  onFocus: () => void;
}) {
  return (
    <li className="overflow-hidden rounded-2xl border border-line bg-cream shadow-soft">
      <button
        type="button"
        onClick={onFocus}
        className={clsx(
          "relative block aspect-[4/3] w-full overflow-hidden transition active:scale-[0.99]",
        )}
      >
        {place.photo_ref ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/places/photo?ref=${encodeURIComponent(place.photo_ref)}&w=480`}
            alt={place.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="grid h-full w-full place-items-center text-2xl"
            style={{ background: CATEGORY_COLOR[category] + "22" }}
          >
            {CATEGORY_EMOJI[category]}
          </div>
        )}
        <span
          className="absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-full font-serif text-[12px] font-bold text-white shadow"
          style={{ background: CATEGORY_COLOR[category] }}
        >
          {rank}
        </span>
      </button>
      <div className="p-2">
        <div className="line-clamp-1 font-serif text-sm font-semibold leading-tight">
          {place.name}
        </div>
        <div className="mt-0.5 line-clamp-1 text-[10px] text-muted">
          {place.address ?? "—"}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted">
          {place.rating != null && (
            <span className="font-semibold text-ink">
              ★ {Number(place.rating).toFixed(1)}
              <span className="ml-0.5 font-normal text-muted">
                ({place.user_ratings_total ?? 0})
              </span>
            </span>
          )}
          {place.price_level != null && (
            <span>{"·".repeat(place.price_level + 1)}</span>
          )}
        </div>
        <button
          onClick={onAdd}
          className="mt-2 w-full rounded-xl bg-ink px-2 py-1.5 text-[11px] font-semibold text-cream transition active:scale-[0.97]"
        >
          + Add
        </button>
      </div>
    </li>
  );
}
