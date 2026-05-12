"use client";

import { useEffect, useRef, useState } from "react";

type Hit = { name: string; place_name: string; lat: number; lng: number };

export default function AddStopModal({
  slug,
  onClose,
  onAdded,
}: {
  slug: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);
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
    setBusy(true);
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
    setBusy(false);
    onAdded();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 backdrop-blur-sm animate-fade-in sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-full flex-col rounded-t-4xl bg-cream shadow-lift animate-slide-up sm:max-w-lg sm:rounded-4xl"
        style={{ paddingBottom: "max(1rem, var(--safe-bottom))" }}
      >
        <div className="flex justify-center pt-2 pb-1 sm:hidden">
          <span className="h-1 w-10 rounded-full bg-line" />
        </div>
        <div className="flex items-center justify-between gap-3 px-5 pt-3 pb-2 sm:pt-5">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
              New stop
            </div>
            <h2 className="font-serif text-xl font-semibold tracking-tight">
              Where to next?
            </h2>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-sand text-ink transition active:scale-[0.92] hover:bg-line"
          >
            ✕
          </button>
        </div>
        <div className="px-5 pb-3">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search a town, region, address…"
            className="w-full rounded-2xl border border-line bg-cream px-4 py-3 outline-none focus:border-rust"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-line bg-cream px-4 py-2.5 text-sm outline-none focus:border-rust"
          />
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {hits.length === 0 && q.trim() && (
            <div className="rounded-2xl border border-dashed border-line bg-cream/50 px-4 py-6 text-center text-sm text-muted">
              keep typing…
            </div>
          )}
          <ul className="flex flex-col gap-1.5">
            {hits.map((h) => (
              <li key={`${h.lat},${h.lng}`}>
                <button
                  onClick={() => pick(h)}
                  disabled={busy}
                  className="flex w-full items-start gap-3 rounded-2xl border border-line bg-cream px-4 py-3 text-left transition active:scale-[0.99] hover:border-ink disabled:opacity-50"
                >
                  <span className="mt-0.5 text-lg">📍</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-serif font-semibold text-ink">{h.name}</div>
                    <div className="truncate text-[11px] text-muted">{h.place_name}</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
