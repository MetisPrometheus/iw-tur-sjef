"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import type { Day, Stop, TripBundle } from "@/lib/types";
import StopCarousel from "./StopCarousel";
import DayRibbon from "./DayRibbon";
import CarouselCard from "./CarouselCard";
import AddSuggestionModal from "./AddSuggestionModal";

export default function TripSheet({
  bundle,
  slug,
  meId,
  activeStopId,
  activeDate,
  onPickStop,
  onPickDate,
  onAddStop,
  onMutated,
}: {
  bundle: TripBundle;
  slug: string;
  meId: string | null;
  activeStopId: string | null;
  activeDate: string | null;
  onPickStop: (id: string | null) => void;
  onPickDate: (d: string) => void;
  onAddStop: () => void;
  onMutated: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [dragY, setDragY] = useState(0);
  const dragStart = useRef<number | null>(null);
  const dragMoved = useRef(false);

  const activeStop = useMemo(
    () => bundle.stops.find((s) => s.id === activeStopId) ?? null,
    [bundle.stops, activeStopId],
  );

  // Days for this stop.
  const stopDays = useMemo(
    () =>
      activeStop
        ? bundle.days
            .filter((d) => d.stop_id === activeStop.id)
            .sort((a, b) => a.date.localeCompare(b.date))
        : [],
    [bundle.days, activeStop],
  );

  // Auto-pick first day when stop changes.
  useEffect(() => {
    if (!stopDays.length) return;
    if (activeDate && stopDays.some((d) => d.date.startsWith(activeDate))) return;
    onPickDate(stopDays[0].date.slice(0, 10));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStopId, stopDays.length]);

  const activeDay = useMemo(
    () => stopDays.find((d) => d.date.startsWith(activeDate ?? "")) ?? stopDays[0] ?? null,
    [stopDays, activeDate],
  );

  // Suggestions for the active day, sorted by votes.
  const sugs = useMemo(() => {
    if (!activeDay) return [];
    return bundle.suggestions
      .filter((s) => s.day_id === activeDay.id)
      .map((s) => ({
        s,
        votes: bundle.votes.filter((v) => v.suggestion_id === s.id),
      }))
      .sort(
        (a, b) =>
          b.votes.length - a.votes.length ||
          a.s.created_at.localeCompare(b.s.created_at),
      );
  }, [activeDay, bundle.suggestions, bundle.votes]);

  const winners = useMemo(() => {
    if (!activeDay) return new Set<string>();
    return new Set(
      sugs.slice(0, activeDay.capacity).filter((x) => x.votes.length > 0).map((x) => x.s.id),
    );
  }, [activeDay, sugs]);

  function startDrag(clientY: number) {
    dragStart.current = clientY;
    dragMoved.current = false;
  }
  function moveDrag(clientY: number) {
    if (dragStart.current == null) return;
    const dy = clientY - dragStart.current;
    if (Math.abs(dy) > 3) dragMoved.current = true;
    setDragY(Math.max(dy, expanded ? -40 : 0));
  }
  function endDrag() {
    if (dragStart.current == null) return;
    if (dragMoved.current) {
      if (dragY > 80) setExpanded(false);
      else if (dragY < -40) setExpanded(true);
    } else {
      setExpanded((e) => !e);
    }
    dragStart.current = null;
    setDragY(0);
  }

  async function addDay() {
    if (!activeStop) return;
    const date = prompt(
      "Date for this day (YYYY-MM-DD)?",
      activeStop.arrival_date?.slice(0, 10) ?? "",
    );
    if (!date) return;
    await fetch(`/api/trips/${slug}/days`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stop_id: activeStop.id, date }),
    });
    onPickDate(date);
    onMutated();
  }

  async function setCapacity(c: number) {
    if (!activeDay) return;
    const clamped = Math.max(1, Math.min(20, c));
    await fetch(`/api/trips/${slug}/days/${activeDay.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ capacity: clamped }),
    });
    onMutated();
  }

  async function setLabel(label: string) {
    if (!activeDay) return;
    await fetch(`/api/trips/${slug}/days/${activeDay.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });
    onMutated();
  }

  async function deleteStop(stopId: string) {
    if (!confirm("Remove this stop and all its days?")) return;
    await fetch(`/api/trips/${slug}/stops/${stopId}`, { method: "DELETE" });
    onPickStop(null);
    onMutated();
  }

  return (
    <>
      <aside
        className={clsx(
          "pointer-events-auto fixed left-2 right-2 z-30 flex flex-col overflow-hidden rounded-t-4xl bg-cream shadow-sheet transition-all duration-300 sm:left-4 sm:right-4 md:left-auto md:right-4 md:top-24 md:bottom-4 md:w-[420px] md:rounded-4xl md:shadow-lift",
          "bottom-0",
          expanded ? "h-[78dvh] md:h-auto" : "h-[36dvh] md:h-auto",
        )}
        style={{
          transform: dragY ? `translateY(${dragY}px)` : undefined,
          transition: dragStart.current != null ? "none" : undefined,
        }}
      >
        <div
          className="flex shrink-0 cursor-grab justify-center pt-2 pb-1 active:cursor-grabbing md:hidden"
          onPointerDown={(e) => {
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            startDrag(e.clientY);
          }}
          onPointerMove={(e) => moveDrag(e.clientY)}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <span className="h-1 w-12 rounded-full bg-line" />
        </div>

        {bundle.stops.length === 0 ? (
          <EmptyState onAddStop={onAddStop} />
        ) : (
          <div className="flex flex-1 flex-col overflow-y-auto pb-3">
            <StopCarousel
              stops={bundle.stops}
              activeStopId={activeStopId}
              onPick={onPickStop}
              onAdd={onAddStop}
              onDelete={deleteStop}
            />

            {activeStop && (
              <div className="mt-3 px-4">
                <h2 className="font-serif text-2xl font-semibold leading-tight tracking-tight">
                  {activeStop.name}
                </h2>
              </div>
            )}

            {activeStop && stopDays.length > 0 && (
              <DayRibbon
                dates={stopDays.map((d) => d.date.slice(0, 10))}
                activeDate={activeDate}
                onPick={onPickDate}
                onAdd={addDay}
              />
            )}

            {activeStop && stopDays.length === 0 && (
              <div className="mx-4 mt-3 grid place-items-center rounded-3xl border border-dashed border-line bg-cream/50 px-4 py-8 text-center">
                <div className="text-3xl">📅</div>
                <p className="mt-2 text-sm text-muted">
                  no days yet for {activeStop.name}
                </p>
                <button
                  onClick={addDay}
                  className="mt-3 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-cream transition active:scale-[0.97]"
                >
                  ＋ Add first day
                </button>
              </div>
            )}

            {activeDay && (
              <DayHeader
                day={activeDay}
                count={sugs.length}
                onCapacity={setCapacity}
                onLabel={setLabel}
                onSuggest={() => setAdding(true)}
              />
            )}

            {activeDay && sugs.length === 0 && (
              <div className="mx-4 mt-2 grid place-items-center rounded-3xl border border-dashed border-line bg-cream/50 px-4 py-8 text-center">
                <div className="text-3xl">💭</div>
                <p className="mt-2 text-sm text-muted">
                  Nothing pitched yet. Throw stuff in — anything.
                </p>
                <button
                  onClick={() => setAdding(true)}
                  className="mt-3 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-cream transition active:scale-[0.97]"
                >
                  ＋ Suggest something
                </button>
              </div>
            )}

            {activeDay && sugs.length > 0 && (
              <div className="flex gap-3 overflow-x-auto no-scrollbar snap-ribbon px-4 pt-1">
                {sugs.map(({ s, votes }) => (
                  <CarouselCard
                    key={s.id}
                    suggestion={s}
                    votes={votes}
                    participants={bundle.participants}
                    meId={meId}
                    slug={slug}
                    isWinner={winners.has(s.id)}
                    onMutated={onMutated}
                  />
                ))}
                <button
                  onClick={() => setAdding(true)}
                  className="flex w-[180px] shrink-0 flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-cream/40 text-muted transition active:scale-[0.98] hover:border-ink hover:text-ink"
                >
                  <div className="text-3xl">＋</div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-wider">
                    Suggest
                  </div>
                </button>
              </div>
            )}
          </div>
        )}
      </aside>

      {adding && activeDay && activeStop && (
        <AddSuggestionModal
          day={activeDay}
          stop={activeStop}
          slug={slug}
          meId={meId}
          onClose={() => setAdding(false)}
          onAdded={() => {
            onMutated();
          }}
        />
      )}
    </>
  );
}

function EmptyState({ onAddStop }: { onAddStop: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 pb-8 pt-2 text-center">
      <div className="text-4xl">🗺️</div>
      <h2 className="mt-3 font-serif text-2xl font-semibold tracking-tight">
        Drop your first stop
      </h2>
      <p className="mt-2 max-w-xs text-sm text-muted">
        A road trip starts somewhere. Search a town, pick a date — then
        pitch the options and let the crew vote.
      </p>
      <button
        onClick={onAddStop}
        className="mt-5 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-cream shadow-soft transition active:scale-[0.97]"
      >
        ＋ Add stop
      </button>
    </div>
  );
}

function DayHeader({
  day,
  count,
  onCapacity,
  onLabel,
  onSuggest,
}: {
  day: Day;
  count: number;
  onCapacity: (c: number) => void;
  onLabel: (l: string) => void;
  onSuggest: () => void;
}) {
  const dt = new Date(day.date.slice(0, 10) + "T00:00:00");
  const dateLabel = dt.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  const [editingLabel, setEditingLabel] = useState(false);
  const [draftLabel, setDraftLabel] = useState(day.label ?? "");

  return (
    <div className="flex items-end justify-between gap-2 px-4 pt-3 pb-2">
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
          {dateLabel}
        </div>
        {editingLabel ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onLabel(draftLabel.trim());
              setEditingLabel(false);
            }}
          >
            <input
              autoFocus
              value={draftLabel}
              onChange={(e) => setDraftLabel(e.target.value)}
              onBlur={() => {
                onLabel(draftLabel.trim());
                setEditingLabel(false);
              }}
              maxLength={60}
              placeholder="add a label"
              className="w-full bg-transparent font-serif text-lg font-semibold tracking-tight text-ink outline-none"
            />
          </form>
        ) : (
          <button
            onClick={() => {
              setDraftLabel(day.label ?? "");
              setEditingLabel(true);
            }}
            className="text-left font-serif text-lg font-semibold leading-tight tracking-tight text-ink hover:text-rust"
          >
            {day.label || "untitled day"}
          </button>
        )}
        <div className="mt-0.5 text-[11px] text-muted">
          {count} suggestion{count === 1 ? "" : "s"} · top{" "}
          <button
            onClick={() => {
              const v = prompt("How many winners?", String(day.capacity));
              const n = v ? parseInt(v, 10) : NaN;
              if (Number.isFinite(n)) onCapacity(n);
            }}
            className="font-semibold text-ink hover:text-rust"
          >
            {day.capacity}
          </button>{" "}
          win
        </div>
      </div>
      <button
        onClick={onSuggest}
        className="shrink-0 rounded-full bg-rust px-4 py-2 text-xs font-semibold text-white shadow-soft transition active:scale-[0.96] hover:bg-rust-dark"
      >
        ＋ Suggest
      </button>
    </div>
  );
}
