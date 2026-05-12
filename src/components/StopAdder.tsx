"use client";

import { useEffect, useRef, useState } from "react";

type Hit = { name: string; place_name: string; lat: number; lng: number };

export default function StopAdder({
  slug,
  onAdded,
}: {
  slug: string;
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [date, setDate] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) {
      setHits([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const r = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      const data = (await r.json()) as { hits: Hit[] };
      setHits(data.hits ?? []);
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q]);

  async function pick(h: Hit) {
    await fetch(`/api/trips/${slug}/stops`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: h.name,
        lat: h.lat,
        lng: h.lng,
        arrival_date: date || null,
      }),
    });
    setQ("");
    setDate("");
    setHits([]);
    setOpen(false);
    onAdded();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-2 w-full rounded-lg border border-dashed border-line bg-white px-3 py-2.5 text-xs font-medium text-muted hover:border-brand hover:bg-brand-tint hover:text-brand-dark"
      >
        + Add stop
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-lg border border-line bg-white p-3 shadow-card">
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search a town, region, address…"
        className="w-full rounded-md border border-line bg-soft px-2 py-1.5 text-sm outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="mt-2 w-full rounded-md border border-line bg-soft px-2 py-1.5 text-xs outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
      />
      {hits.length > 0 && (
        <ul className="mt-2 max-h-56 overflow-y-auto rounded-md border border-line">
          {hits.map((h) => (
            <li key={`${h.lat},${h.lng}`}>
              <button
                onClick={() => pick(h)}
                className="block w-full px-2 py-1.5 text-left text-xs hover:bg-soft"
              >
                <div className="font-medium">{h.name}</div>
                <div className="truncate text-muted">{h.place_name}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        onClick={() => {
          setOpen(false);
          setQ("");
          setHits([]);
        }}
        className="mt-2 w-full text-center text-[11px] text-slate-400 hover:text-ink"
      >
        cancel
      </button>
    </div>
  );
}
