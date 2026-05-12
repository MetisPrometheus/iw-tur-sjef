"use client";

import clsx from "clsx";

export default function DayRibbon({
  dates,
  activeDate,
  onPick,
  onAdd,
}: {
  dates: string[];
  activeDate: string | null;
  onPick: (d: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar snap-ribbon px-4 py-2">
      {dates.map((d) => {
        const active = d === activeDate;
        const dt = new Date(d.slice(0, 10) + "T00:00:00");
        return (
          <button
            key={d}
            onClick={() => onPick(d)}
            className={clsx(
              "flex shrink-0 flex-col items-center rounded-2xl border px-3 py-1.5 text-center transition active:scale-[0.97]",
              active
                ? "border-transparent bg-ink text-cream shadow-soft"
                : "border-line bg-cream/70 text-ink hover:border-ink",
            )}
          >
            <span className="text-[10px] font-medium uppercase tracking-wider opacity-70">
              {dt.toLocaleDateString(undefined, { weekday: "short" })}
            </span>
            <span className="font-serif text-lg font-semibold leading-none">
              {dt.getDate()}
            </span>
            <span className="text-[9px] uppercase tracking-wider opacity-60">
              {dt.toLocaleDateString(undefined, { month: "short" })}
            </span>
          </button>
        );
      })}
      <button
        onClick={onAdd}
        className="flex shrink-0 flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-cream/40 px-3 py-1.5 text-muted transition active:scale-[0.97] hover:border-ink hover:text-ink"
      >
        <span className="text-lg leading-none">＋</span>
        <span className="text-[10px] font-medium tracking-wider">day</span>
      </button>
    </div>
  );
}
