"use client";

import clsx from "clsx";
import type { Stop } from "@/lib/types";

export default function StopCarousel({
  stops,
  activeStopId,
  onPick,
  onAdd,
  onDelete,
}: {
  stops: Stop[];
  activeStopId: string | null;
  onPick: (stopId: string) => void;
  onAdd: () => void;
  onDelete: (stopId: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar snap-ribbon px-4 pt-3">
      {stops.map((s, i) => {
        const letter = String.fromCharCode(65 + i);
        const active = s.id === activeStopId;
        return (
          <div key={s.id} className="relative shrink-0">
            <button
              onClick={() => onPick(s.id)}
              className={clsx(
                "flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition active:scale-[0.98]",
                active
                  ? "border-transparent bg-ink text-cream shadow-soft"
                  : "border-line bg-cream/80 text-ink hover:border-ink",
              )}
            >
              <span
                className="grid h-6 w-6 place-items-center rounded-full font-serif text-xs font-bold"
                style={{
                  background: "linear-gradient(135deg,#fcd34d,#c4633c)",
                  color: "#2a2520",
                }}
              >
                {letter}
              </span>
              <span className="font-serif font-semibold tracking-tight">{s.name}</span>
            </button>
            {active && stops.length > 1 && (
              <button
                onClick={() => onDelete(s.id)}
                className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-rust text-[9px] font-bold text-white shadow"
                title="Remove stop"
              >
                ✕
              </button>
            )}
          </div>
        );
      })}
      <button
        onClick={onAdd}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-dashed border-line bg-cream/40 text-muted transition active:scale-[0.95] hover:border-ink hover:text-ink"
        title="Add stop"
      >
        ＋
      </button>
    </div>
  );
}
