"use client";

import { CATEGORY_COLOR, CATEGORY_EMOJI, CATEGORY_LABEL, type Category } from "@/lib/types";

export default function BrowseBar({
  category,
  anchorName,
  loading,
  count,
  onExit,
}: {
  category: Category;
  anchorName: string;
  loading: boolean;
  count: number;
  onExit: () => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-20 z-20 flex justify-center px-3 sm:top-24">
      <div
        className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-cream/95 px-3 py-1.5 shadow-glass backdrop-blur-md"
        style={{ borderTop: `3px solid ${CATEGORY_COLOR[category]}` }}
      >
        <span className="text-lg leading-none">{CATEGORY_EMOJI[category]}</span>
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Browsing
          </span>
          <span className="text-sm font-semibold text-ink">
            {CATEGORY_LABEL[category]} near {anchorName}
          </span>
        </div>
        <span className="ml-1 rounded-full bg-sand px-2 py-0.5 text-[10px] font-bold text-ink">
          {loading ? "…" : count}
        </span>
        <button
          onClick={onExit}
          className="ml-1 grid h-7 w-7 place-items-center rounded-full bg-ink text-xs text-cream transition active:scale-[0.92]"
          aria-label="Stop browsing"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
