"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import type {
  TripBundle,
  DaySlot,
  SlotKind,
} from "@/lib/types";
import { SLOT_COLOR, SLOT_LABEL, SLOT_EMOJI } from "@/lib/types";
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
      <div className="grid h-full place-items-center p-8 text-center sm:p-12">
        <div className="max-w-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Pick a slot
          </div>
          <h2 className="mt-2 text-xl font-semibold sm:text-2xl">
            Drop a stop, add a day, suggest things to do.
          </h2>
          <p className="mt-3 text-sm text-muted">
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
    .sort(
      (a, b) =>
        b.votes.length - a.votes.length ||
        a.s.created_at.localeCompare(b.s.created_at),
    );

  const winners = new Set(
    suggestions.slice(0, slot.capacity).map((x) => x.s.id),
  );

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line bg-white px-4 pt-4 pb-4 sm:px-6 sm:pt-5">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-muted">
          <span className="truncate">{stop.name}</span>
          <span className="text-line">·</span>
          <span>{prettyDate(slot.date)}</span>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-lg"
            style={{
              background: SLOT_COLOR[slot.kind as SlotKind] + "1f",
              color: SLOT_COLOR[slot.kind as SlotKind],
            }}
            aria-hidden
          >
            {SLOT_EMOJI[slot.kind as SlotKind]}
          </span>
          <h1 className="text-xl font-semibold sm:text-2xl">
            {slot.label || SLOT_LABEL[slot.kind as SlotKind]}
          </h1>
          {slot.time_start && (
            <span className="text-sm text-muted">
              {slot.time_start.slice(0, 5)}
              {slot.time_end ? `–${slot.time_end.slice(0, 5)}` : ""}
            </span>
          )}
          <span className="ml-auto rounded-full bg-brand-tint px-2.5 py-1 text-xs font-medium text-brand-dark">
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

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
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
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Suggestions ({suggestions.length})
          </div>
          {suggestions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line bg-white px-4 py-8 text-center text-sm text-muted">
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
                  isWinner={winners.has(s.id) && votes.length > 0}
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
        "rounded-full px-3 py-1.5 font-medium transition active:scale-[0.97]",
        active
          ? "bg-ink text-white"
          : "bg-soft text-muted hover:bg-line hover:text-ink",
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
    <div className="rounded-xl border border-line bg-white p-4">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. that ramen place Marius mentioned"
        className="w-full rounded-md border border-line bg-soft px-3 py-2 text-sm outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
      />
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="optional note — why you want it"
        rows={2}
        maxLength={280}
        className="mt-2 w-full resize-none rounded-md border border-line bg-soft px-3 py-2 text-sm outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
      />
      <button
        onClick={add}
        disabled={!name.trim() || !meId}
        className="mt-2 rounded-md bg-ink px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
      >
        Suggest it
      </button>
    </div>
  );
}

function prettyDate(d: string): string {
  return new Date(d.slice(0, 10) + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
