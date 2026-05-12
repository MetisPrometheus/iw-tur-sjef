"use client";

import { useState } from "react";
import type { Participant } from "@/lib/types";

export default function TopRail({
  participants,
  meId,
}: {
  participants: Participant[];
  meId: string | null;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-cream/85 p-1.5 backdrop-blur-md shadow-glass">
      <div className="flex -space-x-2 pl-1">
        {participants.slice(0, 4).map((p) => (
          <span
            key={p.id}
            title={p.display_name}
            className="grid h-8 w-8 place-items-center rounded-full border-2 border-cream text-[11px] font-semibold text-white"
            style={{
              background: p.color,
              outline: p.id === meId ? "2px solid #2a2520" : "none",
              outlineOffset: 1,
            }}
          >
            {p.display_name.slice(0, 2).toUpperCase()}
          </span>
        ))}
        {participants.length > 4 && (
          <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-cream bg-sand text-[11px] font-semibold text-ink">
            +{participants.length - 4}
          </span>
        )}
      </div>
      <button
        onClick={copy}
        className="rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-cream transition active:scale-[0.97] hover:bg-ink/85"
      >
        {copied ? "Copied!" : "Share"}
      </button>
    </div>
  );
}
