"use client";

import clsx from "clsx";

export type ViewMode = "route" | "slot" | "map";

const ITEMS: { id: ViewMode; icon: string; label: string }[] = [
  { id: "route", icon: "🗺️", label: "Route" },
  { id: "slot", icon: "✦", label: "Slot" },
  { id: "map", icon: "🌍", label: "Map" },
];

export default function ViewToggle({
  value,
  onChange,
  badges,
  floating = false,
}: {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
  badges?: Partial<Record<ViewMode, number>>;
  floating?: boolean;
}) {
  return (
    <div
      className={clsx(
        "inline-flex shrink-0 rounded-full p-1",
        floating
          ? "border border-white/30 bg-slate-900/70 shadow-lg backdrop-blur-md"
          : "border border-line bg-white shadow-card",
      )}
    >
      {ITEMS.map((it) => {
        const active = value === it.id;
        const badge = badges?.[it.id];
        return (
          <button
            key={it.id}
            onClick={() => onChange(it.id)}
            className={clsx(
              "relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-[0.97]",
              active
                ? floating
                  ? "bg-white text-ink shadow"
                  : "bg-ink text-white shadow"
                : floating
                ? "text-white/85 hover:bg-white/10"
                : "text-muted hover:bg-soft hover:text-ink",
            )}
          >
            <span className="text-sm leading-none">{it.icon}</span>
            <span>{it.label}</span>
            {badge !== undefined && badge > 0 && (
              <span
                className={clsx(
                  "ml-0.5 grid h-4 min-w-[16px] place-items-center rounded-full px-1 text-[9px] font-bold",
                  active
                    ? floating
                      ? "bg-ink text-white"
                      : "bg-white text-ink"
                    : floating
                    ? "bg-white/20 text-white"
                    : "bg-ink text-white",
                )}
              >
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
