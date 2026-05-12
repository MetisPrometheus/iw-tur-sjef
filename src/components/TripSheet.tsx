"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import type { DaySlot, Stop, TripBundle, SlotKind } from "@/lib/types";
import { SLOT_COLOR, SLOT_EMOJI, SLOT_LABEL } from "@/lib/types";
import StopCarousel from "./StopCarousel";
import DayRibbon from "./DayRibbon";
import SlotGrid from "./SlotGrid";
import SlotAdderInline from "./SlotAdderInline";
import CarouselCard from "./CarouselCard";
import AddSuggestionModal from "./AddSuggestionModal";

type Mode = "overview" | "slot";

export default function TripSheet({
  bundle,
  slug,
  meId,
  activeStopId,
  activeDate,
  activeSlotId,
  onPickStop,
  onPickDate,
  onPickSlot,
  onAddStop,
  onMutated,
}: {
  bundle: TripBundle;
  slug: string;
  meId: string | null;
  activeStopId: string | null;
  activeDate: string | null;
  activeSlotId: string | null;
  onPickStop: (id: string | null) => void;
  onPickDate: (d: string) => void;
  onPickSlot: (id: string) => void;
  onAddStop: () => void;
  onMutated: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [addingSlot, setAddingSlot] = useState(false);
  const [addingSuggestion, setAddingSuggestion] = useState(false);
  const [dragY, setDragY] = useState(0);
  const dragStart = useRef<number | null>(null);
  const dragMoved = useRef(false);

  const activeStop = useMemo(
    () => bundle.stops.find((s) => s.id === activeStopId) ?? null,
    [bundle.stops, activeStopId],
  );
  const activeSlot = useMemo(
    () => bundle.slots.find((s) => s.id === activeSlotId) ?? null,
    [bundle.slots, activeSlotId],
  );
  const slotStop = activeSlot
    ? bundle.stops.find((s) => s.id === activeSlot.stop_id) ?? null
    : null;

  const mode: Mode = activeSlot ? "slot" : "overview";

  // Dates for active stop
  const stopSlots = activeStop
    ? bundle.slots.filter((s) => s.stop_id === activeStop.id)
    : [];
  const dates = Array.from(new Set(stopSlots.map((s) => s.date))).sort();
  const slotsForDate = activeDate
    ? stopSlots.filter((s) => s.date === activeDate)
    : [];

  // When stop changes, default the date.
  useEffect(() => {
    if (mode === "slot") return;
    if (!dates.length) return;
    if (activeDate && dates.includes(activeDate)) return;
    onPickDate(dates[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStopId, dates.join(",")]);

  // Slot detail
  const slotSugs = activeSlot
    ? bundle.suggestions
        .filter((s) => s.slot_id === activeSlot.id)
        .map((s) => ({
          s,
          votes: bundle.votes.filter((v) => v.suggestion_id === s.id),
        }))
        .sort(
          (a, b) =>
            b.votes.length - a.votes.length ||
            a.s.created_at.localeCompare(b.s.created_at),
        )
    : [];
  const winners = new Set(
    slotSugs.slice(0, activeSlot?.capacity ?? 0).map((x) => x.s.id),
  );

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
    const date = prompt("Date for this day (YYYY-MM-DD)?");
    if (!date) return;
    // Create a "lunch" slot as a placeholder to materialize the day.
    await fetch(`/api/trips/${slug}/slots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stop_id: activeStop.id,
        date,
        kind: "lunch",
        capacity: 1,
      }),
    });
    onPickDate(date);
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
          expanded ? "h-[78dvh] md:h-auto" : "h-[34dvh] md:h-auto",
        )}
        style={{
          transform: dragY ? `translateY(${dragY}px)` : undefined,
          transition: dragStart.current != null ? "none" : undefined,
        }}
      >
        {/* Grab handle (mobile only) */}
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

        {mode === "overview" ? (
          <OverviewContent
            stops={bundle.stops}
            activeStop={activeStop}
            slotsForDate={slotsForDate}
            dates={dates}
            activeDate={activeDate}
            activeSlotId={activeSlotId}
            bundle={bundle}
            onPickStop={onPickStop}
            onPickDate={onPickDate}
            onPickSlot={onPickSlot}
            onAddStop={onAddStop}
            onAddDay={addDay}
            onDeleteStop={deleteStop}
            addingSlot={addingSlot}
            setAddingSlot={setAddingSlot}
            onSlotAdded={() => {
              setAddingSlot(false);
              onMutated();
            }}
            slug={slug}
          />
        ) : (
          activeSlot &&
          slotStop && (
            <SlotDetailContent
              slot={activeSlot}
              stop={slotStop}
              sugs={slotSugs}
              winners={winners}
              participants={bundle.participants}
              meId={meId}
              slug={slug}
              onBack={() => onPickSlot("")}
              onAddSuggestion={() => setAddingSuggestion(true)}
              onMutated={onMutated}
            />
          )
        )}
      </aside>

      {addingSuggestion && activeSlot && slotStop && (
        <AddSuggestionModal
          slot={activeSlot}
          stop={slotStop}
          slug={slug}
          meId={meId}
          onClose={() => setAddingSuggestion(false)}
          onAdded={() => {
            onMutated();
          }}
        />
      )}
    </>
  );
}

function OverviewContent({
  stops,
  activeStop,
  slotsForDate,
  dates,
  activeDate,
  activeSlotId,
  bundle,
  onPickStop,
  onPickDate,
  onPickSlot,
  onAddStop,
  onAddDay,
  onDeleteStop,
  addingSlot,
  setAddingSlot,
  onSlotAdded,
  slug,
}: {
  stops: Stop[];
  activeStop: Stop | null;
  slotsForDate: DaySlot[];
  dates: string[];
  activeDate: string | null;
  activeSlotId: string | null;
  bundle: TripBundle;
  onPickStop: (id: string | null) => void;
  onPickDate: (d: string) => void;
  onPickSlot: (id: string) => void;
  onAddStop: () => void;
  onAddDay: () => void;
  onDeleteStop: (id: string) => void;
  addingSlot: boolean;
  setAddingSlot: (b: boolean) => void;
  onSlotAdded: () => void;
  slug: string;
}) {
  if (stops.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-8 pt-2 text-center">
        <div className="text-4xl">🗺️</div>
        <h2 className="mt-3 font-serif text-2xl font-semibold tracking-tight">
          Drop your first stop
        </h2>
        <p className="mt-2 max-w-xs text-sm text-muted">
          A road trip starts somewhere. Search a town, pick a date — then
          pitch the lunch options and let the crew vote.
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
  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <StopCarousel
        stops={stops}
        activeStopId={activeStop?.id ?? null}
        onPick={onPickStop}
        onAdd={onAddStop}
        onDelete={onDeleteStop}
      />
      {activeStop && (
        <div className="px-4 pt-3">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-xl font-semibold leading-tight tracking-tight">
              {activeStop.name}
            </h2>
            {activeStop.arrival_date && (
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
                arriving{" "}
                {new Date(
                  activeStop.arrival_date.slice(0, 10) + "T00:00:00",
                ).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
          </div>
        </div>
      )}
      {activeStop && dates.length > 0 && (
        <DayRibbon
          dates={dates}
          activeDate={activeDate}
          onPick={onPickDate}
          onAdd={onAddDay}
        />
      )}
      {activeStop && dates.length === 0 && (
        <div className="mx-4 mt-3 rounded-2xl border border-dashed border-line bg-cream/50 px-4 py-5 text-center text-sm text-muted">
          no days yet for {activeStop.name}
          <div className="mt-2">
            <button
              onClick={() => setAddingSlot(true)}
              className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-cream transition active:scale-[0.97]"
            >
              ＋ Add first day
            </button>
          </div>
        </div>
      )}
      {activeStop && activeDate && (
        <SlotGrid
          bundle={bundle}
          slots={slotsForDate}
          activeSlotId={activeSlotId}
          onPickSlot={onPickSlot}
          onAddSlot={() => setAddingSlot(true)}
        />
      )}
      {activeStop && addingSlot && (
        <SlotAdderInline
          stopId={activeStop.id}
          slug={slug}
          defaultDate={activeDate ?? ""}
          onAdded={onSlotAdded}
          onCancel={() => setAddingSlot(false)}
        />
      )}
    </div>
  );
}

function SlotDetailContent({
  slot,
  stop,
  sugs,
  winners,
  participants,
  meId,
  slug,
  onBack,
  onAddSuggestion,
  onMutated,
}: {
  slot: DaySlot;
  stop: Stop;
  sugs: { s: import("@/lib/types").Suggestion; votes: import("@/lib/types").Vote[] }[];
  winners: Set<string>;
  participants: import("@/lib/types").Participant[];
  meId: string | null;
  slug: string;
  onBack: () => void;
  onAddSuggestion: () => void;
  onMutated: () => void;
}) {
  const kind = slot.kind as SlotKind;
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-3 px-4 pt-1 pb-3 sm:px-5 sm:pt-2">
        <button
          onClick={onBack}
          className="grid h-9 w-9 place-items-center rounded-full bg-sand text-ink transition active:scale-[0.92] hover:bg-line"
          aria-label="Back"
        >
          ←
        </button>
        <span
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-2xl"
          style={{ background: SLOT_COLOR[kind] + "26", color: SLOT_COLOR[kind] }}
        >
          {SLOT_EMOJI[kind]}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            {stop.name} · {prettyDate(slot.date)}
          </div>
          <h2 className="truncate font-serif text-xl font-semibold tracking-tight">
            {slot.label || SLOT_LABEL[kind]}
            {slot.time_start && (
              <span className="ml-2 text-sm font-normal text-muted">
                {slot.time_start.slice(0, 5)}
                {slot.time_end ? `–${slot.time_end.slice(0, 5)}` : ""}
              </span>
            )}
          </h2>
        </div>
        <span className="shrink-0 rounded-full bg-sage-tint px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sage-dark">
          top {slot.capacity} win
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sugs.length === 0 ? (
          <div className="mx-4 mb-4 grid place-items-center rounded-2xl border border-dashed border-line bg-cream/50 px-4 py-10 text-center">
            <div className="text-4xl">🎯</div>
            <p className="mt-2 text-sm text-muted">
              No one&apos;s suggested anything yet
            </p>
            <button
              onClick={onAddSuggestion}
              className="mt-3 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-cream transition active:scale-[0.97]"
            >
              ＋ Suggest a place
            </button>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto no-scrollbar snap-ribbon px-4 pb-4">
            {sugs.map(({ s, votes }) => (
              <CarouselCard
                key={s.id}
                suggestion={s}
                votes={votes}
                participants={participants}
                meId={meId}
                slug={slug}
                isWinner={winners.has(s.id)}
                onMutated={onMutated}
              />
            ))}
            <button
              onClick={onAddSuggestion}
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
    </div>
  );
}

function prettyDate(d: string): string {
  return new Date(d.slice(0, 10) + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
