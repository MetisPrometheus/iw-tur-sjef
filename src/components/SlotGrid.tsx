"use client";

import clsx from "clsx";
import type { DaySlot, SlotKind, TripBundle } from "@/lib/types";
import { SLOT_COLOR, SLOT_EMOJI, SLOT_LABEL } from "@/lib/types";

export default function SlotGrid({
  bundle,
  slots,
  activeSlotId,
  onPickSlot,
  onAddSlot,
}: {
  bundle: TripBundle;
  slots: DaySlot[];
  activeSlotId: string | null;
  onPickSlot: (id: string) => void;
  onAddSlot: () => void;
}) {
  const counts = bundle.votes.reduce<Record<string, number>>((m, v) => {
    m[v.suggestion_id] = (m[v.suggestion_id] ?? 0) + 1;
    return m;
  }, {});

  return (
    <div className="grid grid-cols-2 gap-2 px-4 pb-3">
      {slots.map((s) => {
        const sugs = bundle.suggestions.filter((sg) => sg.slot_id === s.id);
        const top = sugs
          .slice()
          .sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0))[0];
        const active = activeSlotId === s.id;
        const kind = s.kind as SlotKind;
        return (
          <button
            key={s.id}
            onClick={() => onPickSlot(s.id)}
            className={clsx(
              "group relative overflow-hidden rounded-2xl border p-3 text-left transition active:scale-[0.98]",
              active
                ? "border-transparent bg-ink text-cream shadow-lift"
                : "border-line bg-cream hover:border-ink",
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className="grid h-9 w-9 place-items-center rounded-full text-lg"
                style={{
                  background: active ? SLOT_COLOR[kind] : SLOT_COLOR[kind] + "26",
                  color: active ? "#fff" : SLOT_COLOR[kind],
                }}
              >
                {SLOT_EMOJI[kind]}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-serif text-base font-semibold leading-tight">
                  {s.label || SLOT_LABEL[kind]}
                </div>
                {s.time_start && (
                  <div
                    className={clsx(
                      "text-[10px] font-medium uppercase tracking-wider",
                      active ? "text-cream/60" : "text-muted",
                    )}
                  >
                    {s.time_start.slice(0, 5)}
                    {s.time_end ? `–${s.time_end.slice(0, 5)}` : ""}
                  </div>
                )}
              </div>
              <span
                className={clsx(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  active ? "bg-cream/15 text-cream" : "bg-sand text-muted",
                )}
              >
                {sugs.length}
              </span>
            </div>
            <div
              className={clsx(
                "mt-2 truncate text-[11px]",
                active ? "text-cream/80" : "text-muted",
              )}
            >
              {top ? `→ ${top.name}` : "no suggestions yet"}
            </div>
          </button>
        );
      })}
      <button
        onClick={onAddSlot}
        className="grid place-items-center rounded-2xl border border-dashed border-line bg-cream/50 p-4 text-muted transition active:scale-[0.98] hover:border-ink hover:text-ink"
      >
        <div className="text-2xl leading-none">＋</div>
        <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider">
          add slot
        </div>
      </button>
    </div>
  );
}
