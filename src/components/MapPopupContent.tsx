"use client";

import {
  CATEGORIES,
  CATEGORY_COLOR,
  CATEGORY_EMOJI,
  CATEGORY_LABEL,
  type Category,
  type Stop,
  type Suggestion,
  type TripBundle,
} from "@/lib/types";

export type GhostPlace = {
  place_id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  rating: number | null;
  user_ratings_total: number | null;
  photo_ref: string | null;
  url: string | null;
  price_level: number | null;
  category: Category;
};

export type SelectedPin =
  | { kind: "stop"; stopId: string }
  | { kind: "saved"; suggestionId: string }
  | { kind: "ghost"; placeId: string };

export type PopupAction =
  | { type: "browseFromStop"; stopId: string; category: Category }
  | { type: "browseFromHotel"; hotelId: string; category: Category }
  | { type: "unpin"; suggestionId: string }
  | { type: "addGhost"; place: GhostPlace };

export default function MapPopupContent({
  selectedPin,
  bundle,
  ghosts,
  onAction,
  onClose,
}: {
  selectedPin: SelectedPin;
  bundle: TripBundle;
  ghosts: GhostPlace[];
  onAction: (a: PopupAction) => void;
  onClose: () => void;
}) {
  if (selectedPin.kind === "stop") {
    const stop = bundle.stops.find((s) => s.id === selectedPin.stopId);
    if (!stop) return null;
    return <StopPopup stop={stop} onAction={onAction} onClose={onClose} />;
  }
  if (selectedPin.kind === "saved") {
    const s = bundle.suggestions.find((x) => x.id === selectedPin.suggestionId);
    if (!s) return null;
    if (s.category === "hotel") {
      return <HotelPopup suggestion={s} onAction={onAction} onClose={onClose} />;
    }
    return <SavedPopup suggestion={s} onAction={onAction} onClose={onClose} />;
  }
  if (selectedPin.kind === "ghost") {
    const p = ghosts.find((g) => g.place_id === selectedPin.placeId);
    if (!p) return null;
    return <GhostPopup place={p} onAction={onAction} onClose={onClose} />;
  }
  return null;
}

function StopPopup({
  stop,
  onAction,
  onClose,
}: {
  stop: Stop;
  onAction: (a: PopupAction) => void;
  onClose: () => void;
}) {
  return (
    <div className="w-[244px] space-y-2.5">
      <PopupHeader title={stop.name} subtitle={stopRange(stop)} onClose={onClose} />
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
        What&apos;s nearby?
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {CATEGORIES.map((c) => (
          <CategoryButton
            key={c}
            category={c}
            onClick={() =>
              onAction({ type: "browseFromStop", stopId: stop.id, category: c })
            }
          />
        ))}
      </div>
    </div>
  );
}

function HotelPopup({
  suggestion,
  onAction,
  onClose,
}: {
  suggestion: Suggestion;
  onAction: (a: PopupAction) => void;
  onClose: () => void;
}) {
  return (
    <div className="w-[244px] space-y-2.5">
      <PopupHeader
        title={suggestion.name}
        subtitle={suggestion.address ?? "Hotel"}
        onClose={onClose}
        emoji="🛏️"
      />
      <div className="flex gap-1.5">
        <button
          onClick={() => onAction({ type: "unpin", suggestionId: suggestion.id })}
          className="flex-1 rounded-full border border-line bg-cream px-2 py-1.5 text-[11px] font-semibold transition active:scale-[0.96] hover:border-rust hover:text-rust"
        >
          ★ Unpin
        </button>
        {suggestion.url && (
          <a
            href={suggestion.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-ink px-3 py-1.5 text-[11px] font-semibold text-cream transition active:scale-[0.96]"
          >
            ↗ Maps
          </a>
        )}
      </div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
        Browse around this hotel
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {(["food", "drink", "activity"] as Category[]).map((c) => (
          <CategoryButton
            key={c}
            category={c}
            onClick={() =>
              onAction({
                type: "browseFromHotel",
                hotelId: suggestion.id,
                category: c,
              })
            }
          />
        ))}
      </div>
    </div>
  );
}

function SavedPopup({
  suggestion,
  onAction,
  onClose,
}: {
  suggestion: Suggestion;
  onAction: (a: PopupAction) => void;
  onClose: () => void;
}) {
  return (
    <div className="w-[220px] space-y-2.5">
      <PopupHeader
        title={suggestion.name}
        subtitle={suggestion.address ?? CATEGORY_LABEL[suggestion.category]}
        onClose={onClose}
        emoji={CATEGORY_EMOJI[suggestion.category]}
      />
      {suggestion.rating != null && (
        <div className="text-[11px]">
          <span className="font-semibold">
            ★ {Number(suggestion.rating).toFixed(1)}
          </span>
        </div>
      )}
      <div className="flex gap-1.5">
        <button
          onClick={() => onAction({ type: "unpin", suggestionId: suggestion.id })}
          className="flex-1 rounded-full border border-line bg-cream px-2 py-1.5 text-[11px] font-semibold transition active:scale-[0.96] hover:border-rust hover:text-rust"
        >
          ★ Remove from map
        </button>
        {suggestion.url && (
          <a
            href={suggestion.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-ink px-3 py-1.5 text-[11px] font-semibold text-cream transition active:scale-[0.96]"
          >
            ↗
          </a>
        )}
      </div>
    </div>
  );
}

function GhostPopup({
  place,
  onAction,
  onClose,
}: {
  place: GhostPlace;
  onAction: (a: PopupAction) => void;
  onClose: () => void;
}) {
  return (
    <div className="w-[232px] space-y-2">
      <PopupHeader
        title={place.name}
        subtitle={place.address ?? CATEGORY_LABEL[place.category]}
        onClose={onClose}
        emoji={CATEGORY_EMOJI[place.category]}
      />
      {place.photo_ref && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/places/photo?ref=${encodeURIComponent(place.photo_ref)}&w=440`}
          alt={place.name}
          className="aspect-[5/3] w-full rounded-lg object-cover"
        />
      )}
      <div className="flex items-center gap-2 text-[11px]">
        {place.rating != null && (
          <span className="font-semibold">
            ★ {Number(place.rating).toFixed(1)}
            <span className="ml-0.5 font-normal text-muted">
              ({place.user_ratings_total ?? 0})
            </span>
          </span>
        )}
        {place.price_level != null && (
          <span className="text-muted">{"·".repeat(place.price_level + 1)}</span>
        )}
      </div>
      <button
        onClick={() => onAction({ type: "addGhost", place })}
        className="w-full rounded-xl bg-ink px-3 py-2 text-sm font-semibold text-cream transition active:scale-[0.98]"
      >
        + Add to my trip
      </button>
    </div>
  );
}

function PopupHeader({
  title,
  subtitle,
  onClose,
  emoji,
}: {
  title: string;
  subtitle?: string | null;
  onClose: () => void;
  emoji?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {emoji && <span className="text-base leading-none">{emoji}</span>}
          <div className="font-serif text-base font-semibold leading-tight tracking-tight">
            {title}
          </div>
        </div>
        {subtitle && (
          <div className="mt-0.5 line-clamp-1 text-[10px] text-muted">{subtitle}</div>
        )}
      </div>
      <button
        onClick={onClose}
        className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sand text-[11px] text-ink transition active:scale-[0.9] hover:bg-line"
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  );
}

function CategoryButton({
  category,
  onClick,
}: {
  category: Category;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-0.5 rounded-xl border border-line bg-cream py-2 transition active:scale-[0.95] hover:border-ink"
      style={{ color: CATEGORY_COLOR[category] }}
    >
      <span className="text-lg leading-none">{CATEGORY_EMOJI[category]}</span>
      <span className="text-[10px] font-semibold text-ink">
        {CATEGORY_LABEL[category]}
      </span>
    </button>
  );
}

function stopRange(stop: Stop): string | null {
  if (!stop.start_date) return null;
  const start = new Date(stop.start_date.slice(0, 10) + "T00:00:00");
  const end = stop.end_date
    ? new Date(stop.end_date.slice(0, 10) + "T00:00:00")
    : null;
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  if (!end || end.getTime() === start.getTime()) {
    return start.toLocaleDateString(undefined, opts);
  }
  return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;
}
