"use client";

import clsx from "clsx";

export default function PlannerButton({
  open,
  pinnedCount,
  stopCount,
  onToggle,
}: {
  open: boolean;
  pinnedCount: number;
  stopCount: number;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="pointer-events-auto fixed left-1/2 top-3 z-30 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-cream/95 px-3.5 py-2 text-sm font-semibold shadow-glass backdrop-blur-md transition active:scale-[0.97] sm:top-4"
      aria-label={open ? "Close planner" : "Open planner"}
    >
      <span className="text-base leading-none">🗺️</span>
      <span>Planner</span>
      {(pinnedCount > 0 || stopCount > 0) && (
        <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-ink px-1.5 text-[10px] font-bold text-cream">
          {pinnedCount > 0 ? pinnedCount : stopCount}
        </span>
      )}
      <span
        className={clsx(
          "text-[10px] text-muted transition-transform",
          open && "rotate-180",
        )}
      >
        ▾
      </span>
    </button>
  );
}
