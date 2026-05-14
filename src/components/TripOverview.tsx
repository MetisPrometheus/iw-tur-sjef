"use client";

import clsx from "clsx";
import type { Stop, TripBundle, Category, Trip } from "@/lib/types";
import { CATEGORIES, CATEGORY_COLOR, CATEGORY_EMOJI } from "@/lib/types";

export default function TripOverview({
  bundle,
  activeStopId,
  onPickStop,
  onDeleteStop,
  onAddStop,
}: {
  bundle: TripBundle;
  activeStopId: string | null;
  onPickStop: (id: string) => void;
  onDeleteStop: (id: string) => void;
  onAddStop: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 px-4 pb-4">
      <TripSummary trip={bundle.trip} stops={bundle.stops} suggestions={bundle.suggestions} />

      <div className="flex flex-col gap-2">
        {bundle.stops.map((stop, i) => (
          <StopCard
            key={stop.id}
            stop={stop}
            index={i}
            isActive={stop.id === activeStopId}
            bundle={bundle}
            onPick={() => onPickStop(stop.id)}
            onDelete={() => onDeleteStop(stop.id)}
          />
        ))}
      </div>

      <button
        onClick={onAddStop}
        className="rounded-2xl border border-dashed border-line bg-cream/60 py-3 text-sm font-semibold text-muted transition active:scale-[0.98] hover:border-ink hover:bg-cream hover:text-ink"
      >
        + Add another stop
      </button>
    </div>
  );
}

function TripSummary({
  trip,
  stops,
  suggestions,
}: {
  trip: Trip;
  stops: Stop[];
  suggestions: TripBundle["suggestions"];
}) {
  const span = tripSpan(trip);
  const totalPinned = suggestions.filter((s) => s.is_pinned).length;
  const byCat: Partial<Record<Category, number>> = {};
  for (const s of suggestions) {
    if (s.is_pinned) byCat[s.category] = (byCat[s.category] ?? 0) + 1;
  }
  return (
    <div className="rounded-3xl border border-line bg-cream/60 p-3.5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
        Trip overview
      </div>
      <h2 className="mt-1 font-serif text-xl font-semibold tracking-tight">
        {trip.name}
      </h2>
      {span && <div className="mt-0.5 text-[11px] text-muted">{span}</div>}
      <div className="mt-2 flex items-center gap-3 text-[11px] text-ink">
        <span>
          <span className="font-bold">{stops.length}</span>
          <span className="ml-0.5 text-muted">
            {" "}stop{stops.length === 1 ? "" : "s"}
          </span>
        </span>
        <span>
          <span className="font-bold">{totalPinned}</span>
          <span className="ml-0.5 text-muted"> pinned</span>
        </span>
        {CATEGORIES.map((c) =>
          byCat[c] ? (
            <span key={c} className="flex items-center gap-0.5 text-muted">
              <span style={{ color: CATEGORY_COLOR[c] }}>{CATEGORY_EMOJI[c]}</span>
              <span>{byCat[c]}</span>
            </span>
          ) : null,
        )}
      </div>
    </div>
  );
}

function StopCard({
  stop,
  index,
  isActive,
  bundle,
  onPick,
  onDelete,
}: {
  stop: Stop;
  index: number;
  isActive: boolean;
  bundle: TripBundle;
  onPick: () => void;
  onDelete: () => void;
}) {
  const letter = String.fromCharCode(65 + index);
  const sugs = bundle.suggestions.filter((s) => s.stop_id === stop.id && s.is_pinned);
  const byCat: Partial<Record<Category, number>> = {};
  for (const s of sugs) byCat[s.category] = (byCat[s.category] ?? 0) + 1;
  const range = stopRange(stop);

  return (
    <div
      className={clsx(
        "relative flex items-stretch gap-3 rounded-3xl border bg-cream p-3 transition",
        isActive ? "border-ink shadow-soft" : "border-line",
      )}
    >
      <button
        onClick={onPick}
        className="flex flex-1 items-start gap-3 text-left"
      >
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full font-serif text-base font-bold"
          style={{
            background: "linear-gradient(135deg,#fcd34d,#c4633c)",
            color: "#2a2520",
          }}
        >
          {letter}
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-serif text-base font-semibold leading-tight tracking-tight">
            {stop.name}
          </div>
          {range && (
            <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted">
              {range}
            </div>
          )}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) =>
              byCat[c] ? (
                <span
                  key={c}
                  className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                  style={{
                    background: CATEGORY_COLOR[c] + "1a",
                    color: CATEGORY_COLOR[c],
                  }}
                >
                  <span>{CATEGORY_EMOJI[c]}</span>
                  <span>{byCat[c]}</span>
                </span>
              ) : null,
            )}
            {sugs.length === 0 && (
              <span className="text-[10px] italic text-muted">
                nothing pinned yet
              </span>
            )}
          </div>
        </div>
      </button>
      {bundle.stops.length > 1 && (
        <button
          onClick={onDelete}
          className="grid h-8 w-8 shrink-0 place-items-center self-start rounded-full text-xs text-muted transition hover:bg-rust/10 hover:text-rust"
          title="Remove stop"
        >
          ✕
        </button>
      )}
    </div>
  );
}

function tripSpan(trip: Trip): string | null {
  if (!trip.start_date) return null;
  const start = new Date(trip.start_date.slice(0, 10) + "T00:00:00");
  const end = trip.end_date
    ? new Date(trip.end_date.slice(0, 10) + "T00:00:00")
    : null;
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  if (!end || end.getTime() === start.getTime()) {
    return start.toLocaleDateString(undefined, { ...opts, year: "numeric" });
  }
  const days = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1,
  );
  return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)} · ${days} day${days === 1 ? "" : "s"}`;
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
  const nights = Math.round(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)} · ${nights} night${nights === 1 ? "" : "s"}`;
}
