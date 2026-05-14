"use client";

import clsx from "clsx";
import type { Stop, TripBundle, Category, Trip } from "@/lib/types";
import { CATEGORIES, CATEGORY_COLOR, CATEGORY_EMOJI } from "@/lib/types";
import { balances, settle } from "@/lib/settle";

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

      <Settlements bundle={bundle} />
    </div>
  );
}

function Settlements({ bundle }: { bundle: TripBundle }) {
  if (bundle.expenses.length === 0) return null;
  const bs = balances(bundle.participants, bundle.expenses, bundle.splits);
  const transfers = settle(bs);
  const currency = bundle.expenses[0]?.currency ?? "NOK";
  const total = bundle.expenses.reduce((a, e) => a + Number(e.amount), 0);

  return (
    <div className="mt-2 rounded-3xl border border-line bg-cream/60 p-3.5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
        💸 Money
      </div>
      <div className="mt-1 font-serif text-lg font-semibold tracking-tight">
        Total spent · {Math.round(total)} {currency}
      </div>

      <div className="mt-3 flex flex-col gap-1">
        {bs.map((b) => {
          const p = bundle.participants.find((pp) => pp.id === b.participant_id);
          if (!p) return null;
          return (
            <div
              key={b.participant_id}
              className="flex items-center justify-between rounded-xl bg-cream px-3 py-1.5 text-sm"
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: p.color }}
                />
                <span className="font-semibold">{p.display_name}</span>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-muted">
                  paid <span className="font-semibold text-ink">{round(b.paid)}</span>
                </span>
                <span
                  className={clsx(
                    "font-semibold",
                    b.net > 0.005
                      ? "text-emerald-600"
                      : b.net < -0.005
                      ? "text-rust"
                      : "text-muted",
                  )}
                >
                  {b.net > 0.005
                    ? `+${round(b.net)}`
                    : b.net < -0.005
                    ? `${round(b.net)}`
                    : "settled"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {transfers.length > 0 && (
        <div className="mt-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
            To settle
          </div>
          <ul className="mt-1 flex flex-col gap-1">
            {transfers.map((t, i) => {
              const from = bundle.participants.find((p) => p.id === t.from);
              const to = bundle.participants.find((p) => p.id === t.to);
              if (!from || !to) return null;
              return (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-xl bg-cream px-3 py-1.5 text-sm"
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: from.color }}
                    />
                    <span className="font-semibold">{from.display_name}</span>
                    <span className="text-muted">owes</span>
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: to.color }}
                    />
                    <span className="font-semibold">{to.display_name}</span>
                  </span>
                  <span className="font-serif font-bold">
                    {round(t.amount)} {currency}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function round(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2);
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
  const totalDone = suggestions.filter((s) => s.is_done).length;
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
      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-ink">
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
        {totalDone > 0 && (
          <span className="font-semibold text-emerald-600">
            ✓ {totalDone} done
          </span>
        )}
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
