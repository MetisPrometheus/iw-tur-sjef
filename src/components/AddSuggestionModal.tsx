"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import type { DaySlot, Stop } from "@/lib/types";

type NearbyPlace = {
  place_id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  rating: number | null;
  user_ratings_total: number | null;
  photo_ref: string | null;
  url: string | null;
  price_level: number | null;
};

export default function AddSuggestionModal({
  slot,
  stop,
  slug,
  meId,
  onClose,
  onAdded,
}: {
  slot: DaySlot;
  stop: Stop;
  slug: string;
  meId: string | null;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [tab, setTab] = useState<"places" | "free">("places");
  const [q, setQ] = useState("");
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [freeName, setFreeName] = useState("");
  const [freeNote, setFreeNote] = useState("");

  async function load(keyword?: string) {
    setLoading(true);
    try {
      const u = new URL("/api/places/nearby", window.location.origin);
      u.searchParams.set("lat", String(stop.lat));
      u.searchParams.set("lng", String(stop.lng));
      u.searchParams.set("kind", slot.kind);
      if (keyword) u.searchParams.set("q", keyword);
      const r = await fetch(u.toString());
      const data = (await r.json()) as { places: NearbyPlace[] };
      setPlaces(data.places ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot.id]);

  async function addPlace(p: NearbyPlace) {
    if (!meId) return;
    setAdding(p.place_id);
    await fetch(`/api/trips/${slug}/suggestions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slot_id: slot.id,
        added_by: meId,
        place_id: p.place_id,
        name: p.name,
        address: p.address,
        lat: p.lat,
        lng: p.lng,
        rating: p.rating,
        photo_ref: p.photo_ref,
        url: p.url,
      }),
    });
    setAdding(null);
    onAdded();
  }

  async function addFree() {
    if (!freeName.trim() || !meId) return;
    setAdding("free");
    await fetch(`/api/trips/${slug}/suggestions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slot_id: slot.id,
        added_by: meId,
        name: freeName.trim(),
        note: freeNote.trim() || null,
      }),
    });
    setAdding(null);
    setFreeName("");
    setFreeNote("");
    onAdded();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 backdrop-blur-sm animate-fade-in sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full flex-col rounded-t-4xl bg-cream shadow-lift animate-slide-up sm:max-w-2xl sm:rounded-4xl"
        style={{ paddingBottom: "max(1rem, var(--safe-bottom))" }}
      >
        {/* Grab handle (mobile) */}
        <div className="flex justify-center pt-2 pb-1 sm:hidden">
          <span className="h-1 w-10 rounded-full bg-line" />
        </div>

        <div className="flex items-center justify-between gap-3 px-5 pt-3 pb-2 sm:pt-5">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
              Suggest for {stop.name}
            </div>
            <h2 className="font-serif text-xl font-semibold tracking-tight">
              {slot.label ?? "Pick a place"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-sand text-ink transition active:scale-[0.92] hover:bg-line"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-1 px-5 pb-3">
          <Tab active={tab === "places"} onClick={() => setTab("places")}>
            🌎 Nearby
          </Tab>
          <Tab active={tab === "free"} onClick={() => setTab("free")}>
            ✏️ Free text
          </Tab>
        </div>

        {tab === "places" ? (
          <>
            <div className="px-5 pb-3">
              <div className="flex gap-2">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && load(q || undefined)}
                  placeholder={`Search near ${stop.name}…`}
                  className="min-w-0 flex-1 rounded-2xl border border-line bg-cream px-4 py-2.5 text-sm outline-none focus:border-rust"
                />
                <button
                  onClick={() => load(q || undefined)}
                  disabled={loading}
                  className="shrink-0 rounded-2xl bg-ink px-4 py-2.5 text-xs font-semibold text-cream transition active:scale-[0.97] disabled:opacity-40"
                >
                  {loading ? "…" : "Search"}
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-5">
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {places.map((p) => (
                  <li
                    key={p.place_id}
                    className="overflow-hidden rounded-2xl border border-line bg-cream"
                  >
                    {p.photo_ref ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/places/photo?ref=${encodeURIComponent(p.photo_ref)}&w=480`}
                        alt={p.name}
                        className="aspect-[4/3] w-full object-cover"
                      />
                    ) : (
                      <div className="grid aspect-[4/3] w-full place-items-center bg-sand text-2xl">
                        📍
                      </div>
                    )}
                    <div className="p-2.5">
                      <div className="line-clamp-1 font-serif text-sm font-semibold">
                        {p.name}
                      </div>
                      <div className="mt-0.5 line-clamp-1 text-[10px] text-muted">
                        {p.address ?? "—"}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted">
                        {p.rating != null && (
                          <span className="font-semibold text-ink">
                            ★ {p.rating.toFixed(1)}
                          </span>
                        )}
                        {p.price_level != null && (
                          <span>{"·".repeat(p.price_level + 1)}</span>
                        )}
                      </div>
                      <button
                        disabled={!meId || adding === p.place_id}
                        onClick={() => addPlace(p)}
                        className="mt-2 w-full rounded-xl bg-ink px-2 py-1.5 text-[11px] font-semibold text-cream transition active:scale-[0.97] disabled:opacity-40"
                      >
                        {adding === p.place_id ? "adding…" : "Suggest"}
                      </button>
                    </div>
                  </li>
                ))}
                {!loading && places.length === 0 && (
                  <li className="col-span-2 grid place-items-center rounded-2xl border border-dashed border-line bg-cream/50 p-8 text-sm text-muted sm:col-span-3">
                    no places found
                  </li>
                )}
              </ul>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 pb-5">
            <input
              value={freeName}
              onChange={(e) => setFreeName(e.target.value)}
              placeholder="e.g. that ramen place Marius mentioned"
              className="w-full rounded-2xl border border-line bg-cream px-4 py-3 outline-none focus:border-rust"
            />
            <textarea
              value={freeNote}
              onChange={(e) => setFreeNote(e.target.value)}
              placeholder="optional note — why you want it"
              rows={3}
              maxLength={280}
              className="w-full resize-none rounded-2xl border border-line bg-cream px-4 py-3 text-sm outline-none focus:border-rust"
            />
            <button
              onClick={addFree}
              disabled={!freeName.trim() || !meId || adding === "free"}
              className="rounded-2xl bg-ink px-4 py-2.5 text-sm font-semibold text-cream transition active:scale-[0.98] disabled:opacity-40"
            >
              {adding === "free" ? "adding…" : "Suggest it"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Tab({
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
        "rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-[0.97]",
        active ? "bg-ink text-cream" : "bg-sand text-muted hover:bg-line hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
