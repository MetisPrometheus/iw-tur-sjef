"use client";

import { useState } from "react";
import type { Participant, Trip } from "@/lib/types";

export default function Header({
  trip,
  participants,
  meId,
  slug,
  onRename,
}: {
  trip: Trip;
  participants: Participant[];
  meId: string | null;
  slug: string;
  onRename: (name: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(trip.name);
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <header className="shrink-0 border-b border-line bg-white">
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <a
            href="/"
            className="hidden text-xs font-semibold uppercase tracking-[0.22em] text-brand-dark sm:inline"
          >
            tur-sjef
          </a>
          <span className="hidden text-line sm:inline">/</span>
          {editing ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (draft.trim() && draft.trim() !== trip.name) {
                  await onRename(draft.trim());
                }
                setEditing(false);
              }}
              className="min-w-0 flex-1"
            >
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => setEditing(false)}
                className="w-full rounded border border-line bg-soft px-2 py-1 text-base font-semibold sm:text-lg"
                maxLength={80}
              />
            </form>
          ) : (
            <button
              onClick={() => {
                setDraft(trip.name);
                setEditing(true);
              }}
              className="truncate text-base font-semibold hover:text-brand-dark sm:text-lg"
              title="Rename trip"
            >
              {trip.name}
            </button>
          )}
          <code className="hidden rounded bg-soft px-2 py-0.5 text-xs text-muted sm:inline">
            {slug}
          </code>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="flex -space-x-1.5">
            {participants.slice(0, 5).map((p) => (
              <span
                key={p.id}
                title={p.display_name}
                className="grid h-7 w-7 place-items-center rounded-full border-2 border-white text-[10px] font-semibold text-white"
                style={{
                  background: p.color,
                  outline: p.id === meId ? "2px solid #0f172a" : "none",
                  outlineOffset: 1,
                }}
              >
                {p.display_name.slice(0, 2).toUpperCase()}
              </span>
            ))}
            {participants.length > 5 && (
              <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-slate-300 text-[10px] font-semibold text-ink">
                +{participants.length - 5}
              </span>
            )}
          </div>
          <button
            onClick={copy}
            className="rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-ink/90 sm:bg-white sm:text-ink sm:ring-1 sm:ring-inset sm:ring-line sm:hover:bg-soft"
          >
            {copied ? "Copied!" : "Share"}
          </button>
        </div>
      </div>
    </header>
  );
}
