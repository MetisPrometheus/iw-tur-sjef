"use client";

import type { Stop } from "@/lib/types";

export default function SheetChip({
  stop,
  pinnedCount,
  onTap,
}: {
  stop: Stop | null;
  pinnedCount: number;
  onTap: () => void;
}) {
  return (
    <button
      onClick={onTap}
      className="pointer-events-auto fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-cream/95 px-3.5 py-2 text-sm shadow-lift backdrop-blur-md transition active:scale-[0.97] md:hidden"
      style={{ paddingBottom: "max(0.5rem, var(--safe-bottom))" }}
      aria-label="Open trip details"
    >
      <span className="text-base leading-none">▲</span>
      <span className="font-serif font-semibold tracking-tight">
        {stop ? stop.name : "Open trip"}
      </span>
      {pinnedCount > 0 && (
        <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-ink px-1.5 text-[10px] font-bold text-cream">
          {pinnedCount}
        </span>
      )}
    </button>
  );
}
