"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import type {
  TripBundle,
  DaySlot,
  Suggestion,
  SlotKind,
} from "@/lib/types";
import { SLOT_COLOR, SLOT_LABEL } from "@/lib/types";
import PlacesPicker from "./PlacesPicker";
import SuggestionCard from "./SuggestionCard";

export default function SlotPanel({
  bundle,
  slug,
  slot,
  meId,
  onMutated,
}: {
  bundle: TripBundle;
  slug: string;
  slot: DaySlot | null;
  meId: string | null;
  onMutated: () => void;
}) {
  const [tab, setTab] = useState<"places" | "free">("places");

  const stop = useMemo(
    () => (slot ? bundle.stops.find((s) => s.id === slot.stop_id) ?? null : null),
    [slot, bundle.stops],
  );

  if (!slot || !stop) {
    return (
      <div className="grid h-full place-items-center p-12 text-center">
        <div className="max-w-sm">
          <div className="text-xs uppercase tracking-[0.18em] text-ink/40">
            Pick a slot
          </div>
          <h2 className="mt-2 text-xl font-semibold">
            Drop a stop, add a day, suggest things to do.
          </h2>
          <p className="mt-3 text-sm text-ink/60">
            Each slot is a moment in the day — lunch, an afternoon activity,
            where to sleep. Friends pitch options, everyone votes, winners hit
            the map.
          </p>
        </div>
      </div>
    );
  }

  const suggestions = bundle.suggestions
    .filter((s) => s.slot_id === slot.id)
    .map((s) => ({
      s,
      votes: bundle.votes.filter((v) => v.suggestion_id === s.id),
    }))
    .sort((a, b) => b.votes.length - a.votes.length || a.s.created_at.localeCompare(b.s.created_at));

  const winners = new Set(suggestions.slice(0, slot.capacity).map((x) => x.s.id));

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-dust bg-white px-6 pt-5 pb-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-ink/50">
          <span>{stop.name}</span>
          <span className="text-dust">·</span>
          <span>{prettyDate(slot.date)}</span>
        </div>
        <div className="mt-1 flex items-baseline gap-3">
          <h1 className="text-2xl font-semibold">
            {slot.label || SLOT_LABEL[slot.kind as SlotKind]}
          </h1>
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: SLOT_COLOR[slot.kind as SlotKind] }}
          />
          {slot.time_start && (
            <span className="text-sm text-ink/50">
              {slot.time_start.slice(0, 5)}
              {slot.time_end ? `–${slot.time_end.slice(0, 5)}` : ""}
            </span>
          )}
          <span className="ml-auto rounded-full bg-sand/80 px-2.5 py-1 text-xs text-ink/60">
            top {slot.capacity} win
          </span>
        </div>

        <div className="mt-4 flex gap-1 text-xs">
          <TabBtn active={tab === "places"} onClick={() => setTab("places")}>
            Nearby places
          </TabBtn>
          <TabBtn active={tab === "free"} onClick={() => setTab("free")}>
            Free text
          </TabBtn>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {tab === "places" ? (
          <PlacesPicker
            slot={slot}
            stop={stop}
            slug={slug}
            meId={meId}
            onAdded={onMutated}
          />
        ) : (
          <FreeTextAdder slot={slot} slug={slug} meId={meId} onAdded={onMutated} />
        )}

        <div className="mt-8">
          <div className="mb-3 text-xs uppercase tracking-[0.18em] text-ink/50">
            Suggestions ({suggestions.length})
          </div>
          {suggestions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-dust bg-white/60 px-4 py-8 text-center text-sm text-ink/50">
              nothing here yet — add the first one
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {suggestions.map(({ s, votes }) => (
                <SuggestionCard
                  key={s.id}
                  suggestion={s}
                  votes={votes}
                  participants={bundle.participants}
                  meId={meId}
                  slug={slug}
                  isWinner={winners.has(s.id)}
                  onMutated={onMutated}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "rounded-full px-3 py-1 font-medium",
        active ? "bg-ink text-cream" : "bg-sand/60 text-ink/60 hover:bg-sand",
      )}
    >
      {children}
    </button>
  );
}

function FreeTextAdder({
  slot,
  slug,
  meId,
  onAdded,
}: {
  slot: DaySlot;
  slug: string;
  meId: string | null;
  onAdded: () => void;
}) {
  const [name, setName] = useState("");
  const [note, setNote] = useState("");

  async function add() {
    if (!name.trim() || !meId) return;
    await fetch(`/api/trips/${slug}/suggestions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slot_id: slot.id,
        added_by: meId,
        name: name.trim(),
        note: note.trim() || null,
      }),
    });
    setName("");
    setNote("");
    onAdded();
  }

  return (
    <div className="rounded-xl border border-dust bg-white p-4">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. that ramen place Marius mentioned"
        className="w-full rounded-md border border-dust bg-sand/40 px-3 py-2 text-sm outline-none focus:border-moss"
      />
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="optional note — why you want it"
        rows={2}
        maxLength={280}
        className="mt-2 w-full resize-none rounded-md border border-dust bg-sand/40 px-3 py-2 text-sm outline-none focus:border-moss"
      />
      <button
        onClick={add}
        disabled={!name.trim() || !meId}
        className="mt-2 rounded-md bg-ink px-3 py-1.5 text-xs font-medium text-cream disabled:opacity-40"
      >
        Suggest it
      </button>
    </div>
  );
}

function prettyDate(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
