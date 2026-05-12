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

export default function SlotAdderInline({
  stopId,
  slug,
  defaultDate,
  onAdded,
  onCancel,
}: {
  stopId: string;
  slug: string;
  defaultDate: string;
  onAdded: () => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(defaultDate);
  const [kind, setKind] = useState<SlotKind>("lunch");
  const [capacity, setCapacity] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!date) return;
    setBusy(true);
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
    setBusy(false);
    onAdded();
  }

  return (
    <div className="mx-4 mb-3 rounded-2xl border border-line bg-cream p-3 shadow-soft">
      <div className="grid grid-cols-4 gap-1.5">
        {SLOT_KINDS.map((k) => (
          <button
            key={k}
            onClick={() => setKind(k)}
            className={clsx(
              "flex flex-col items-center gap-0.5 rounded-xl border px-1 py-1.5 text-[10px] font-medium transition active:scale-[0.96]",
              kind === k
                ? "border-transparent text-white"
                : "border-line bg-sand/40 text-muted hover:border-ink hover:text-ink",
            )}
            style={kind === k ? { background: SLOT_COLOR[k] } : undefined}
          >
            <span className="text-lg leading-none">{SLOT_EMOJI[k]}</span>
            <span>{SLOT_LABEL[k]}</span>
          </button>
        ))}
      </div>

      {kind === "custom" && (
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="label (e.g. 'museum stop')"
          maxLength={60}
          className="mt-2 w-full rounded-xl border border-line bg-cream px-3 py-2 text-sm outline-none focus:border-rust"
        />
      )}

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="mt-2 w-full rounded-xl border border-line bg-cream px-3 py-2 text-sm outline-none focus:border-rust"
      />

      <div className="mt-2 grid grid-cols-3 gap-1.5 text-sm">
        <input
          type="time"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="rounded-xl border border-line bg-cream px-2 py-2 outline-none focus:border-rust"
        />
        <input
          type="time"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="rounded-xl border border-line bg-cream px-2 py-2 outline-none focus:border-rust"
        />
        <div className="flex items-center justify-between rounded-xl border border-line bg-cream px-2 text-[11px] font-medium">
          <span className="text-muted">top</span>
          <input
            type="number"
            min={1}
            max={10}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            className="w-7 bg-transparent text-center outline-none"
          />
          <span className="text-muted">win</span>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={add}
          disabled={!date || busy}
          className="flex-1 rounded-xl bg-ink px-3 py-2 text-sm font-semibold text-cream transition active:scale-[0.98] disabled:opacity-40"
        >
          {busy ? "…" : "Add slot"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-xl border border-line bg-cream px-3 py-2 text-sm text-muted transition hover:bg-sand/60"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
