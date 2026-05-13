"use client";

import clsx from "clsx";
import {
  CATEGORIES,
  CATEGORY_COLOR,
  CATEGORY_EMOJI,
  CATEGORY_LABEL,
  type Category,
} from "@/lib/types";

export default function CategoryTabs({
  value,
  onChange,
  counts,
}: {
  value: Category;
  onChange: (c: Category) => void;
  counts?: Partial<Record<Category, number>>;
}) {
  return (
    <div className="grid grid-cols-4 gap-1.5 px-4">
      {CATEGORIES.map((c) => {
        const active = value === c;
        const count = counts?.[c] ?? 0;
        return (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={clsx(
              "relative flex flex-col items-center gap-0.5 rounded-2xl border px-1 py-2 text-[11px] font-medium transition active:scale-[0.97]",
              active
                ? "border-transparent text-white shadow-soft"
                : "border-line bg-cream text-muted hover:border-ink hover:text-ink",
            )}
            style={active ? { background: CATEGORY_COLOR[c] } : undefined}
          >
            <span className="text-lg leading-none">{CATEGORY_EMOJI[c]}</span>
            <span>{CATEGORY_LABEL[c]}</span>
            {count > 0 && (
              <span
                className={clsx(
                  "absolute -right-1 -top-1 grid h-4 min-w-[16px] place-items-center rounded-full px-1 text-[9px] font-bold",
                  active ? "bg-cream text-ink" : "bg-ink text-cream",
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
