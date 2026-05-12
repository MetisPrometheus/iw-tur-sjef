"use client";

import { useEffect, useState } from "react";
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
  types: string[];
  url: string | null;
  price_level: number | null;
};

export default function PlacesPicker({
  slot,
  stop,
  slug,
  meId,
  onAdded,
}: {
  slot: DaySlot;
  stop: Stop;
  slug: string;
  meId: string | null;
  onAdded: () => void;
}) {
  const [q, setQ] = useState("");
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);

  async function load(keyword?: string) {
    setLoading(true);
    setErr(null);
    try {
      const u = new URL("/api/places/nearby", window.location.origin);
      u.searchParams.set("lat", String(stop.lat));
      u.searchParams.set("lng", String(stop.lng));
      u.searchParams.set("kind", slot.kind);
      if (keyword) u.searchParams.set("q", keyword);
      const r = await fetch(u.toString());
      if (!r.ok) throw new Error(await r.text());
      const data = (await r.json()) as { places: NearbyPlace[] };
      setPlaces(data.places);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot.id]);

  async function add(p: NearbyPlace) {
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

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(q)}
          placeholder={`Search around ${stop.name}…`}
          className="min-w-0 flex-1 rounded-md border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <button
          onClick={() => load(q || undefined)}
          disabled={loading}
          className="shrink-0 rounded-md bg-ink px-3 py-2 text-xs font-medium text-white disabled:opacity-40"
        >
          {loading ? "…" : "Search"}
        </button>
      </div>

      {err && <div className="mt-2 text-xs text-rose-600">{err}</div>}

      <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {places.map((p) => (
          <li
            key={p.place_id}
            className="overflow-hidden rounded-xl border border-line bg-white shadow-card"
          >
            {p.photo_ref ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/places/photo?ref=${encodeURIComponent(p.photo_ref)}&w=480`}
                alt={p.name}
                className="h-32 w-full object-cover"
              />
            ) : (
              <div className="h-32 w-full bg-soft" />
            )}
            <div className="p-3">
              <div className="line-clamp-1 text-sm font-semibold">{p.name}</div>
              <div className="line-clamp-1 text-[11px] text-muted">
                {p.address ?? "—"}
              </div>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-muted">
                {p.rating != null && (
                  <span className="font-medium text-ink">
                    ★ {p.rating.toFixed(1)}{" "}
                    <span className="font-normal text-slate-400">
                      ({p.user_ratings_total ?? 0})
                    </span>
                  </span>
                )}
                {p.price_level != null && (
                  <span className="text-slate-400">
                    {"$".repeat(p.price_level + 1)}
                  </span>
                )}
              </div>
              <button
                disabled={!meId || adding === p.place_id}
                onClick={() => add(p)}
                className="mt-2 w-full rounded-md border border-line bg-white px-2 py-1.5 text-xs font-medium hover:border-brand hover:bg-brand-tint hover:text-brand-dark disabled:opacity-40"
              >
                {adding === p.place_id ? "adding…" : "Suggest +"}
              </button>
            </div>
          </li>
        ))}
        {!loading && places.length === 0 && (
          <li className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-sm text-muted sm:col-span-2">
            no places found — try a different keyword
          </li>
        )}
      </ul>
    </div>
  );
}
