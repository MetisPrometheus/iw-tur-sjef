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
    <header className="flex items-center justify-between border-b border-dust bg-white px-5 py-3">
      <div className="flex items-center gap-3">
        <a href="/" className="text-xs uppercase tracking-[0.2em] text-moss/80">
          tur-sjef
        </a>
        <span className="text-dust">/</span>
        {editing ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (draft.trim() && draft.trim() !== trip.name) {
                await onRename(draft.trim());
              }
              setEditing(false);
            }}
          >
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => setEditing(false)}
              className="rounded border border-dust bg-sand/40 px-2 py-1 text-lg font-semibold"
              maxLength={80}
            />
          </form>
        ) : (
          <button
            onClick={() => {
              setDraft(trip.name);
              setEditing(true);
            }}
            className="text-lg font-semibold hover:text-rust"
            title="Rename trip"
          >
            {trip.name}
          </button>
        )}
        <code className="ml-2 rounded bg-sand/60 px-2 py-0.5 text-xs text-ink/60">
          {slug}
        </code>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex -space-x-1.5">
          {participants.map((p) => (
            <span
              key={p.id}
              title={p.display_name}
              className="grid h-7 w-7 place-items-center rounded-full border-2 border-white text-[10px] font-semibold text-white"
              style={{
                background: p.color,
                outline: p.id === meId ? "2px solid #0c0a09" : "none",
                outlineOffset: 1,
              }}
            >
              {p.display_name.slice(0, 2).toUpperCase()}
            </span>
          ))}
        </div>
        <button
          onClick={copy}
          className="rounded-lg border border-ink/20 bg-cream px-3 py-1.5 text-xs font-medium hover:bg-sand/60"
        >
          {copied ? "Copied!" : "Share link"}
        </button>
      </div>
    </header>
  );
}
