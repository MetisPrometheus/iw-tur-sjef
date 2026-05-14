"use client";

import { useEffect, useState } from "react";
import {
  CATEGORY_COLOR,
  CATEGORY_EMOJI,
  CATEGORY_LABEL,
  type Category,
} from "@/lib/types";

export default function BrowseBar({
  category,
  anchorName,
  loading,
  count,
  keyword,
  onSearch,
  onExit,
}: {
  category: Category;
  anchorName: string;
  loading: boolean;
  count: number;
  keyword: string | null;
  onSearch: (q: string | null) => void;
  onExit: () => void;
}) {
  const [draft, setDraft] = useState(keyword ?? "");
  useEffect(() => {
    setDraft(keyword ?? "");
  }, [keyword]);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-16 z-20 flex justify-center px-3 sm:top-20">
      <div
        className="pointer-events-auto flex flex-col gap-1.5 rounded-3xl bg-cream/95 px-3 py-2 shadow-glass backdrop-blur-md"
        style={{ borderTop: `3px solid ${CATEGORY_COLOR[category]}` }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">{CATEGORY_EMOJI[category]}</span>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              Browsing
            </span>
            <span className="truncate text-sm font-semibold text-ink">
              {CATEGORY_LABEL[category]} near {anchorName}
            </span>
          </div>
          <span className="ml-1 rounded-full bg-sand px-2 py-0.5 text-[10px] font-bold text-ink">
            {loading ? "…" : count}
          </span>
          <button
            onClick={onExit}
            className="ml-0.5 grid h-7 w-7 place-items-center rounded-full bg-ink text-xs text-cream transition active:scale-[0.92]"
            aria-label="Stop browsing"
          >
            ✕
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSearch(draft.trim() || null);
          }}
          className="flex gap-1.5"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Search a specific place…"
            className="min-w-0 flex-1 rounded-full border border-line bg-cream px-3 py-1.5 text-[12px] outline-none focus:border-rust"
          />
          <button
            type="submit"
            className="rounded-full bg-ink px-3 py-1.5 text-[11px] font-semibold text-cream transition active:scale-[0.96]"
          >
            Search
          </button>
          {keyword && (
            <button
              type="button"
              onClick={() => {
                setDraft("");
                onSearch(null);
              }}
              className="rounded-full border border-line bg-cream px-2 py-1.5 text-[11px] text-muted transition hover:bg-sand"
            >
              clear
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
