"use client";

import { useState } from "react";
import clsx from "clsx";
import {
  SLOT_KINDS,
  SLOT_LABEL,
  SLOT_EMOJI,
  SLOT_COLOR,
  type SlotKind,
} from "@/lib/types";

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
    setKind("lunch");
    onAdded();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-2 w-full rounded-md border border-dashed border-line px-2 py-1.5 text-[11px] font-medium text-muted transition active:scale-[0.98] hover:border-brand hover:bg-brand-tint hover:text-brand-dark"
      >
        + Add to a day
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-lg border border-line bg-white p-3 text-xs shadow-card">
      <div className="grid grid-cols-4 gap-1.5">
        {SLOT_KINDS.map((k) => (
          <button
            key={k}
            onClick={() => setKind(k)}
            className={clsx(
              "flex flex-col items-center gap-0.5 rounded-lg border px-1 py-2 text-[10px] font-medium transition active:scale-[0.96]",
              kind === k
                ? "border-transparent text-white shadow-card"
                : "border-line bg-soft text-muted hover:border-ink hover:text-ink",
            )}
            style={kind === k ? { background: SLOT_COLOR[k] } : undefined}
            title={SLOT_LABEL[k]}
          >
            <span className="text-base leading-none">{SLOT_EMOJI[k]}</span>
            <span className="truncate">{SLOT_LABEL[k]}</span>
          </button>
        ))}
      </div>

      {kind === "custom" && (
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="label (e.g. 'museum stop')"
          maxLength={60}
          className="mt-2 w-full rounded-md border border-line bg-soft px-2 py-1.5 outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
        />
      )}

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="mt-2 w-full rounded-md border border-line bg-soft px-2 py-1.5 outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
      />

      <div className="mt-2 grid grid-cols-3 gap-1.5">
        <input
          type="time"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder="from"
          className="rounded-md border border-line bg-soft px-2 py-1.5 outline-none focus:border-brand focus:bg-white"
        />
        <input
          type="time"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="to"
          className="rounded-md border border-line bg-soft px-2 py-1.5 outline-none focus:border-brand focus:bg-white"
        />
        <div className="flex items-center justify-between rounded-md border border-line bg-soft px-2 text-[10px] font-medium">
          <span className="text-muted">top</span>
          <input
            type="number"
            min={1}
            max={10}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            title="How many winners?"
            className="w-7 bg-transparent text-center outline-none"
          />
          <span className="text-muted">win</span>
        </div>
      </div>

      <div className="mt-2 flex gap-1.5">
        <button
          onClick={add}
          disabled={!date}
          className="flex-1 rounded-md bg-ink px-2 py-1.5 font-medium text-white transition active:scale-[0.98] disabled:opacity-40"
        >
          Add slot
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded-md border border-line bg-white px-2 py-1.5 text-muted transition active:scale-[0.98] hover:bg-soft"
        >
          cancel
        </button>
      </div>
    </div>
  );
}
