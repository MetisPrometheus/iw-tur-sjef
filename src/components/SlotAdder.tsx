"use client";

import { useState } from "react";
import { SLOT_KINDS, SLOT_LABEL, type SlotKind } from "@/lib/types";

export default function SlotAdder({
  stopId,
  slug,
  onAdded,
}: {
  stopId: string;
  slug: string;
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [kind, setKind] = useState<SlotKind>("lunch");
  const [capacity, setCapacity] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [label, setLabel] = useState("");

  async function add() {
    if (!date) return;
    await fetch(`/api/trips/${slug}/slots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stop_id: stopId,
        date,
        kind,
        capacity,
        time_start: from || null,
        time_end: to || null,
        label: label || null,
      }),
    });
    setOpen(false);
    setLabel("");
    setFrom("");
    setTo("");
    onAdded();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-2 w-full rounded-md border border-dashed border-ink/15 px-2 py-1 text-[11px] text-ink/50 hover:bg-white"
      >
        + Add to a day
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-md border border-dust bg-white p-2 text-xs">
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full rounded-md border border-dust bg-sand/40 px-2 py-1 outline-none focus:border-moss"
      />
      <div className="mt-2 flex gap-1.5">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as SlotKind)}
          className="flex-1 rounded-md border border-dust bg-sand/40 px-2 py-1"
        >
          {SLOT_KINDS.map((k) => (
            <option key={k} value={k}>
              {SLOT_LABEL[k]}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          max={10}
          value={capacity}
          onChange={(e) => setCapacity(Number(e.target.value))}
          title="How many winners?"
          className="w-12 rounded-md border border-dust bg-sand/40 px-2 py-1 text-center"
        />
      </div>
      <div className="mt-2 flex gap-1.5">
        <input
          type="time"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder="from"
          className="flex-1 rounded-md border border-dust bg-sand/40 px-2 py-1"
        />
        <input
          type="time"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="to"
          className="flex-1 rounded-md border border-dust bg-sand/40 px-2 py-1"
        />
      </div>
      {kind === "custom" && (
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="label (e.g. 'museum stop')"
          maxLength={60}
          className="mt-2 w-full rounded-md border border-dust bg-sand/40 px-2 py-1"
        />
      )}
      <div className="mt-2 flex gap-1.5">
        <button
          onClick={add}
          disabled={!date}
          className="flex-1 rounded-md bg-ink px-2 py-1 font-medium text-cream disabled:opacity-40"
        >
          Add
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded-md border border-dust bg-white px-2 py-1 text-ink/60"
        >
          cancel
        </button>
      </div>
    </div>
  );
}
