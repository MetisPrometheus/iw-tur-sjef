"use client";

import { useEffect, useState } from "react";
import type { DaySlot, Stop, SlotKind } from "@/lib/types";

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
          className="flex-1 rounded-md border border-dust bg-white px-3 py-2 text-sm outline-none focus:border-moss"
        />
        <button
          onClick={() => load(q || undefined)}
          disabled={loading}
          className="rounded-md bg-ink px-3 py-2 text-xs font-medium text-cream disabled:opacity-40"
        >
          {loading ? "…" : "Search"}
        </button>
      </div>

      {err && <div className="mt-2 text-xs text-rust">{err}</div>}

      <ul className="mt-4 grid grid-cols-2 gap-3">
        {places.map((p) => (
          <li
            key={p.place_id}
            className="overflow-hidden rounded-xl border border-dust bg-white shadow-card"
          >
            {p.photo_ref ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/places/photo?ref=${encodeURIComponent(p.photo_ref)}&w=480`}
                alt={p.name}
                className="h-28 w-full object-cover"
              />
            ) : (
              <div className="h-28 w-full bg-sand" />
            )}
            <div className="p-3">
              <div className="line-clamp-1 text-sm font-medium">{p.name}</div>
              <div className="line-clamp-1 text-[11px] text-ink/50">
                {p.address ?? "—"}
              </div>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-ink/60">
                {p.rating != null && (
                  <span>
                    ★ {p.rating.toFixed(1)}{" "}
                    <span className="text-ink/40">({p.user_ratings_total ?? 0})</span>
                  </span>
                )}
                {p.price_level != null && (
                  <span className="text-ink/40">{"$".repeat(p.price_level + 1)}</span>
                )}
              </div>
              <button
                disabled={!meId || adding === p.place_id}
                onClick={() => add(p)}
                className="mt-2 w-full rounded-md border border-ink/20 bg-cream px-2 py-1 text-xs font-medium hover:bg-sand/60 disabled:opacity-40"
              >
                {adding === p.place_id ? "adding…" : "Suggest +"}
              </button>
            </div>
          </li>
        ))}
        {!loading && places.length === 0 && (
          <li className="col-span-2 rounded-lg border border-dashed border-dust px-4 py-8 text-center text-sm text-ink/50">
            no places found — try a different keyword
          </li>
        )}
      </ul>
    </div>
  );
}
