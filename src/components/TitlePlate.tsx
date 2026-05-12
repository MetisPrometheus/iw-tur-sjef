"use client";

import { useState } from "react";
import type { Trip } from "@/lib/types";

export default function TitlePlate({
  trip,
  slug,
  onRename,
}: {
  trip: Trip;
  slug: string;
  onRename: (name: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(trip.name);

  return (
    <div className="pointer-events-auto inline-flex max-w-[80vw] flex-col rounded-3xl bg-cream/85 px-4 py-2.5 backdrop-blur-md shadow-glass">
      <a href="/" className="text-[10px] font-medium uppercase tracking-[0.28em] text-rust-dark">
        tur-sjef
      </a>
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
            className="w-[60vw] max-w-md bg-transparent font-serif text-2xl font-semibold tracking-tight text-ink outline-none sm:text-3xl"
            maxLength={80}
          />
        </form>
      ) : (
        <button
          onClick={() => {
            setDraft(trip.name);
            setEditing(true);
          }}
          className="text-left font-serif text-2xl font-semibold leading-tight tracking-tight text-ink transition hover:text-rust sm:text-3xl"
        >
          {trip.name}
        </button>
      )}
      <code className="mt-0.5 text-[10px] font-medium tracking-wider text-muted">/{slug}</code>
    </div>
  );
}
