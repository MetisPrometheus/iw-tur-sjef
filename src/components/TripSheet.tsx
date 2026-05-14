"use client";

import { useMemo, useRef, useState } from "react";
import clsx from "clsx";
import type { Category, Stop, TripBundle } from "@/lib/types";
import { CATEGORY_EMOJI, CATEGORY_LABEL } from "@/lib/types";
import StopCarousel from "./StopCarousel";
import CategoryTabs from "./CategoryTabs";
import PinCard from "./PinCard";
import TripOverview from "./TripOverview";

export type SheetState = "hidden" | "peek" | "expanded";

export default function TripSheet({
  bundle,
  slug,
  meId,
  activeStopId,
  activeCategory,
  sheetState,
  onSheetStateChange,
  onPickStop,
  onPickCategory,
  onAddStop,
  onBrowseCategory,
  onMutated,
  focusSuggestionId,
  onClearFocus,
}: {
  bundle: TripBundle;
  slug: string;
  meId: string | null;
  activeStopId: string | null;
  activeCategory: Category;
  sheetState: SheetState;
  onSheetStateChange: (s: SheetState) => void;
  onPickStop: (id: string | null) => void;
  onPickCategory: (c: Category) => void;
  onAddStop: () => void;
  onBrowseCategory: (category: Category) => void;
  onMutated: () => void;
  focusSuggestionId: string | null;
  onClearFocus: () => void;
}) {
  const [view, setView] = useState<"stop" | "trip">("stop");
  const [dragY, setDragY] = useState(0);
  const dragStart = useRef<number | null>(null);
  const dragMoved = useRef(false);
  const stateAtDragStart = useRef<SheetState>("peek");

  const activeStop = useMemo(
    () => bundle.stops.find((s) => s.id === activeStopId) ?? null,
    [bundle.stops, activeStopId],
  );

  const stopSuggestions = useMemo(
    () => (activeStop ? bundle.suggestions.filter((s) => s.stop_id === activeStop.id) : []),
    [bundle.suggestions, activeStop],
  );

  const counts: Partial<Record<Category, number>> = useMemo(() => {
    const c: Partial<Record<Category, number>> = {};
    for (const s of stopSuggestions) {
      if (s.is_pinned) c[s.category] = (c[s.category] ?? 0) + 1;
    }
    return c;
  }, [stopSuggestions]);

  const categorySugs = useMemo(
    () =>
      stopSuggestions
        .filter((s) => s.category === activeCategory)
        .sort((a, b) => {
          if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
          return a.created_at.localeCompare(b.created_at);
        }),
    [stopSuggestions, activeCategory],
  );

  function startDrag(clientY: number) {
    dragStart.current = clientY;
    dragMoved.current = false;
    stateAtDragStart.current = sheetState;
  }
  function moveDrag(clientY: number) {
    if (dragStart.current == null) return;
    const dy = clientY - dragStart.current;
    if (Math.abs(dy) > 3) dragMoved.current = true;
    setDragY(Math.max(dy, stateAtDragStart.current === "expanded" ? -40 : -200));
  }
  function endDrag() {
    if (dragStart.current == null) return;
    const dy = dragY;
    if (dragMoved.current) {
      const from = stateAtDragStart.current;
      if (from === "expanded") {
        if (dy > 100) onSheetStateChange("peek");
      } else if (from === "peek") {
        if (dy < -50) onSheetStateChange("expanded");
        else if (dy > 80) onSheetStateChange("hidden");
      }
    } else {
      if (sheetState === "peek") onSheetStateChange("expanded");
      else if (sheetState === "expanded") onSheetStateChange("peek");
    }
    dragStart.current = null;
    setDragY(0);
  }

  async function deleteStop(stopId: string) {
    if (!confirm("Remove this stop and everything pinned to it?")) return;
    await fetch(`/api/trips/${slug}/stops/${stopId}`, { method: "DELETE" });
    onPickStop(null);
    onMutated();
  }

  if (sheetState === "hidden") return null;

  return (
    <aside
      className={clsx(
        "pointer-events-auto fixed left-2 right-2 z-30 flex flex-col overflow-hidden rounded-t-4xl bg-cream shadow-sheet transition-all duration-300 sm:left-4 sm:right-4 md:left-auto md:right-4 md:top-24 md:bottom-4 md:w-[440px] md:rounded-4xl md:shadow-lift",
        "bottom-0",
        sheetState === "expanded" ? "h-[80dvh] md:h-auto" : "h-[42dvh] md:h-auto",
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

      {/* View toggle: This stop ↔ Whole trip */}
      {bundle.stops.length > 0 && (
        <div className="flex shrink-0 gap-1 px-4 pb-2 pt-1 md:pt-3">
          <ViewPill
            active={view === "stop"}
            onClick={() => setView("stop")}
          >
            📍 This stop
          </ViewPill>
          <ViewPill
            active={view === "trip"}
            onClick={() => setView("trip")}
          >
            🗺️ Whole trip
          </ViewPill>
        </div>
      )}

      {bundle.stops.length === 0 ? (
        <EmptyState onAddStop={onAddStop} />
      ) : view === "trip" ? (
        <div className="flex flex-1 flex-col overflow-y-auto">
          <TripOverview
            bundle={bundle}
            activeStopId={activeStopId}
            onPickStop={(id) => {
              onPickStop(id);
              setView("stop");
            }}
            onDeleteStop={deleteStop}
            onAddStop={onAddStop}
          />
        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-y-auto pb-3">
          <StopCarousel
            stops={bundle.stops}
            activeStopId={activeStopId}
            onPick={onPickStop}
            onAdd={onAddStop}
            onDelete={deleteStop}
          />

          {activeStop && <StopHeader stop={activeStop} />}

          {activeStop && (
            <div className="mt-2">
              <CategoryTabs
                value={activeCategory}
                onChange={onPickCategory}
                counts={counts}
              />
            </div>
          )}

          {activeStop && categorySugs.length === 0 && (
            <div className="mx-4 mt-3 grid place-items-center rounded-3xl border border-dashed border-line bg-cream/50 px-4 py-8 text-center">
              <div className="text-3xl">{CATEGORY_EMOJI[activeCategory]}</div>
              <p className="mt-2 text-sm text-muted">
                No {CATEGORY_LABEL[activeCategory].toLowerCase()} here yet.
              </p>
              <button
                onClick={() => onBrowseCategory(activeCategory)}
                className="mt-3 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-cream transition active:scale-[0.97]"
              >
                📍 Browse nearby
              </button>
            </div>
          )}

          {activeStop && categorySugs.length > 0 && (
            <div className="flex gap-3 overflow-x-auto no-scrollbar snap-ribbon px-4 pt-3">
              {categorySugs.map((s) => (
                <div
                  key={s.id}
                  className={clsx(
                    "transition",
                    focusSuggestionId === s.id && "rounded-3xl ring-4 ring-rust/50",
                  )}
                  onClick={() => focusSuggestionId === s.id && onClearFocus()}
                >
                  <PinCard
                    suggestion={s}
                    participants={bundle.participants}
                    meId={meId}
                    slug={slug}
                    onMutated={onMutated}
                  />
                </div>
              ))}
              <button
                onClick={() => onBrowseCategory(activeCategory)}
                className="flex w-[160px] shrink-0 flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-cream/40 text-muted transition active:scale-[0.98] hover:border-ink hover:text-ink"
              >
                <div className="text-3xl">📍</div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-wider">
                  Browse more
                </div>
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

function ViewPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-[0.97]",
        active
          ? "bg-ink text-cream shadow-soft"
          : "bg-sand text-muted hover:bg-line hover:text-ink",
      )}
    >
      {children}
    </button>
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
        Search a town, set the dates, then tap the pin to browse hotels, food,
        drinks and activities.
      </p>
      <button
        onClick={onAddStop}
        className="mt-5 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-cream shadow-soft transition active:scale-[0.97]"
      >
        + Add stop
      </button>
    </div>
  );
}

function StopHeader({ stop }: { stop: Stop }) {
  const range = stopDateRange(stop);
  return (
    <div className="mt-2 px-4">
      <h2 className="font-serif text-2xl font-semibold leading-tight tracking-tight">
        {stop.name}
      </h2>
      {range && (
        <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-muted">
          {range}
        </div>
      )}
    </div>
  );
}

function stopDateRange(stop: Stop): string | null {
  if (!stop.start_date) return null;
  const start = new Date(stop.start_date.slice(0, 10) + "T00:00:00");
  const end = stop.end_date
    ? new Date(stop.end_date.slice(0, 10) + "T00:00:00")
    : null;
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  if (!end || end.getTime() === start.getTime()) {
    return start.toLocaleDateString(undefined, {
      ...opts,
      weekday: "short",
    });
  }
  const sameMonth = start.getMonth() === end.getMonth();
  const startLabel = sameMonth
    ? start.toLocaleDateString(undefined, { day: "numeric" })
    : start.toLocaleDateString(undefined, opts);
  const endLabel = end.toLocaleDateString(undefined, opts);
  const nights = Math.round(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  return `${startLabel}–${endLabel} · ${nights} night${nights === 1 ? "" : "s"}`;
}
