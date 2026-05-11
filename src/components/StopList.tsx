"use client";

import { useState } from "react";
import clsx from "clsx";
import type { TripBundle, Stop, DaySlot, SlotKind } from "@/lib/types";
import { SLOT_KINDS, SLOT_LABEL, SLOT_COLOR } from "@/lib/types";
import StopAdder from "./StopAdder";
import SlotAdder from "./SlotAdder";

export default function StopList({
  bundle,
  slug,
  activeSlotId,
  onPickSlot,
  onMutated,
}: {
  bundle: TripBundle;
  slug: string;
  activeSlotId: string | null;
  onPickSlot: (id: string) => void;
  onMutated: () => void;
}) {
  return (
    <div className="flex flex-col">
      <div className="px-4 pt-5 pb-2 text-xs uppercase tracking-[0.18em] text-ink/50">
        Route
      </div>
      <ol className="flex flex-col">
        {bundle.stops.map((stop, i) => (
          <StopRow
            key={stop.id}
            stop={stop}
            index={i}
            isLast={i === bundle.stops.length - 1}
            slug={slug}
            bundle={bundle}
            activeSlotId={activeSlotId}
            onPickSlot={onPickSlot}
            onMutated={onMutated}
          />
        ))}
      </ol>
      <div className="px-4 pb-6 pt-2">
        <StopAdder slug={slug} onAdded={onMutated} />
      </div>
    </div>
  );
}

function StopRow({
  stop,
  index,
  isLast,
  slug,
  bundle,
  activeSlotId,
  onPickSlot,
  onMutated,
}: {
  stop: Stop;
  index: number;
  isLast: boolean;
  slug: string;
  bundle: TripBundle;
  activeSlotId: string | null;
  onPickSlot: (id: string) => void;
  onMutated: () => void;
}) {
  const [open, setOpen] = useState(true);
  const slotsForStop = bundle.slots.filter((s) => s.stop_id === stop.id);
  const dates = Array.from(new Set(slotsForStop.map((s) => s.date))).sort();
  const letter = String.fromCharCode(65 + index);

  async function deleteStop() {
    if (!confirm(`Remove ${stop.name}? All its days and votes go too.`)) return;
    await fetch(`/api/trips/${slug}/stops/${stop.id}`, { method: "DELETE" });
    onMutated();
  }

  return (
    <li className="relative">
      <div className="flex items-center gap-2 px-4 py-2 hover:bg-sand/50">
        <button
          onClick={() => setOpen((o) => !o)}
          className="grid h-7 w-7 place-items-center rounded-full bg-ink text-xs font-bold text-cream"
          title={open ? "Collapse" : "Expand"}
        >
          {letter}
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{stop.name}</div>
          {stop.arrival_date && (
            <div className="text-[11px] text-ink/50">{stop.arrival_date}</div>
          )}
        </div>
        <button
          onClick={deleteStop}
          className="rounded text-xs text-ink/40 hover:text-rust"
          title="Remove stop"
        >
          ✕
        </button>
      </div>
      {!isLast && <div className="ml-[27px] h-3 w-px bg-dust" />}
      {open && (
        <div className="pb-2 pl-12 pr-4">
          {dates.length === 0 && (
            <div className="py-1 text-xs italic text-ink/40">no days yet</div>
          )}
          {dates.map((d) => (
            <DayBlock
              key={d}
              date={d}
              slots={slotsForStop.filter((s) => s.date === d)}
              activeSlotId={activeSlotId}
              onPickSlot={onPickSlot}
              bundle={bundle}
              slug={slug}
              onMutated={onMutated}
            />
          ))}
          <SlotAdder stopId={stop.id} slug={slug} onAdded={onMutated} />
        </div>
      )}
    </li>
  );
}

function DayBlock({
  date,
  slots,
  activeSlotId,
  onPickSlot,
  bundle,
  slug,
  onMutated,
}: {
  date: string;
  slots: DaySlot[];
  activeSlotId: string | null;
  onPickSlot: (id: string) => void;
  bundle: TripBundle;
  slug: string;
  onMutated: () => void;
}) {
  return (
    <div className="mt-2">
      <div className="text-[10px] uppercase tracking-[0.18em] text-ink/40">
        {prettyDate(date)}
      </div>
      <ul className="mt-1 flex flex-col gap-1">
        {slots.map((s) => {
          const sugs = bundle.suggestions.filter((sg) => sg.slot_id === s.id);
          const counts = bundle.votes.reduce<Record<string, number>>((m, v) => {
            m[v.suggestion_id] = (m[v.suggestion_id] ?? 0) + 1;
            return m;
          }, {});
          const top = sugs
            .slice()
            .sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0))[0];
          const isActive = activeSlotId === s.id;
          return (
            <li key={s.id}>
              <button
                onClick={() => onPickSlot(s.id)}
                className={clsx(
                  "group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left",
                  isActive ? "bg-ink text-cream" : "hover:bg-sand/70",
                )}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: SLOT_COLOR[s.kind as SlotKind] }}
                />
                <span className="text-xs font-medium">
                  {s.label || SLOT_LABEL[s.kind as SlotKind]}
                </span>
                {s.time_start && (
                  <span
                    className={clsx(
                      "text-[10px]",
                      isActive ? "text-cream/70" : "text-ink/40",
                    )}
                  >
                    {s.time_start.slice(0, 5)}
                    {s.time_end ? `–${s.time_end.slice(0, 5)}` : ""}
                  </span>
                )}
                <span className="ml-auto flex items-center gap-1.5">
                  {top && (
                    <span
                      className={clsx(
                        "max-w-[100px] truncate text-[10px]",
                        isActive ? "text-cream/80" : "text-ink/50",
                      )}
                    >
                      → {top.name}
                    </span>
                  )}
                  <span
                    className={clsx(
                      "rounded px-1 text-[10px]",
                      isActive ? "bg-cream/20" : "bg-dust/60",
                    )}
                  >
                    {sugs.length}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function prettyDate(d: string): string {
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
