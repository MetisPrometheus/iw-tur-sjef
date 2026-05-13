"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getClientId } from "@/lib/client-id";

type GeocodeHit = {
  name: string;
  place_name: string;
  lat: number;
  lng: number;
};

export default function LandingClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [destinationQuery, setDestinationQuery] = useState("");
  const [destination, setDestination] = useState<GeocodeHit | null>(null);
  const [hits, setHits] = useState<GeocodeHit[]>([]);
  const [showHits, setShowHits] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [joinSlug, setJoinSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (destination && destinationQuery === destination.place_name) {
      setHits([]);
      return;
    }
    if (!destinationQuery.trim()) {
      setHits([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const r = await fetch(
        `/api/geocode?q=${encodeURIComponent(destinationQuery)}`,
      );
      const data = (await r.json()) as { hits: GeocodeHit[] };
      setHits(data.hits ?? []);
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [destinationQuery, destination]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          start_date: startDate || null,
          end_date: endDate || null,
          boss_client_id: getClientId(),
          destination: destination
            ? { name: destination.name, lat: destination.lat, lng: destination.lng }
            : null,
        }),
      });
      if (!r.ok) throw new Error(await r.text());
      const { slug } = (await r.json()) as { slug: string };
      router.push(`/t/${slug}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "failed");
      setBusy(false);
    }
  }

  function join(e: React.FormEvent) {
    e.preventDefault();
    const s = joinSlug.trim().replace(/^.*\/t\//, "");
    if (s) router.push(`/t/${s}`);
  }

  return (
    <main className="grain relative min-h-[100dvh] overflow-y-auto bg-cream">
      <div className="relative mx-auto flex max-w-5xl flex-col px-5 pt-12 pb-20 sm:px-8 sm:pt-20">
        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-rust-dark">
          tur-sjef · a road-trip atlas
        </div>
        <h1 className="mt-4 font-serif text-[2.5rem] font-semibold leading-[1.02] tracking-tight sm:text-6xl">
          Plan the road,
          <br />
          <span className="italic text-rust">together.</span>
        </h1>
        <p className="mt-5 max-w-xl text-base text-ink/75 sm:text-lg">
          Pick where you&apos;re going, drop pins on a satellite globe, fill each
          stop with hotels, food, drinks and activities — keep the best ones,
          drop the rest.
        </p>

        <div className="mt-10 grid gap-5 sm:mt-14 sm:grid-cols-[1.4fr_1fr] sm:gap-7">
          <form
            onSubmit={create}
            className="relative overflow-hidden rounded-4xl border border-line bg-cream p-6 shadow-soft transition hover:shadow-lift sm:p-8"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-30 blur-3xl"
              style={{ background: "radial-gradient(circle, #fcd34d, transparent 70%)" }}
            />
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-rust-dark">
              Start fresh
            </div>
            <h2 className="mt-2 font-serif text-2xl font-semibold tracking-tight">
              Begin a new trip
            </h2>

            <Label>What are you calling it?</Label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lofoten i juli"
              className="w-full rounded-2xl border border-line bg-cream px-4 py-3 text-base outline-none focus:border-rust"
              maxLength={80}
            />

            <Label>Where are you going?</Label>
            <div className="relative">
              <input
                value={destinationQuery}
                onChange={(e) => {
                  setDestinationQuery(e.target.value);
                  setDestination(null);
                  setShowHits(true);
                }}
                onFocus={() => setShowHits(true)}
                onBlur={() => setTimeout(() => setShowHits(false), 150)}
                placeholder="A town, region, country…"
                className="w-full rounded-2xl border border-line bg-cream px-4 py-3 text-base outline-none focus:border-rust"
              />
              {showHits && hits.length > 0 && (
                <ul className="absolute z-10 mt-1.5 w-full overflow-hidden rounded-2xl border border-line bg-cream shadow-lift">
                  {hits.map((h) => (
                    <li key={`${h.lat},${h.lng}`}>
                      <button
                        type="button"
                        onMouseDown={() => {
                          setDestination(h);
                          setDestinationQuery(h.place_name);
                          setShowHits(false);
                          setHits([]);
                        }}
                        className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-sand"
                      >
                        <span className="mt-0.5">📍</span>
                        <div className="min-w-0 flex-1">
                          <div className="font-serif font-semibold">{h.name}</div>
                          <div className="truncate text-[11px] text-muted">
                            {h.place_name}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <Label>From</Label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-2xl border border-line bg-cream px-4 py-3 text-sm outline-none focus:border-rust"
                />
              </div>
              <div>
                <Label>To</Label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-2xl border border-line bg-cream px-4 py-3 text-sm outline-none focus:border-rust"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={busy || !name.trim()}
              className="mt-5 w-full rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-cream transition active:scale-[0.98] disabled:opacity-40"
            >
              {busy ? "creating…" : "Create the atlas →"}
            </button>
            {err && <div className="mt-3 text-sm text-rust">{err}</div>}
          </form>

          <form
            onSubmit={join}
            className="relative overflow-hidden rounded-4xl border border-line bg-cream p-6 shadow-soft transition hover:shadow-lift sm:p-8"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -left-10 -bottom-10 h-36 w-36 rounded-full opacity-25 blur-3xl"
              style={{ background: "radial-gradient(circle, #7c9885, transparent 70%)" }}
            />
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sage-dark">
              Got a link?
            </div>
            <h2 className="mt-2 font-serif text-2xl font-semibold tracking-tight">
              Join an existing one
            </h2>
            <Label>Slug or full URL</Label>
            <input
              value={joinSlug}
              onChange={(e) => setJoinSlug(e.target.value)}
              placeholder="ab3kpq8m9d"
              className="w-full rounded-2xl border border-line bg-cream px-4 py-3 text-base outline-none focus:border-sage-dark"
            />
            <button
              type="submit"
              disabled={!joinSlug.trim()}
              className="mt-5 w-full rounded-2xl border border-line bg-cream px-4 py-3 text-sm font-semibold text-ink transition active:scale-[0.98] hover:bg-sand disabled:opacity-40"
            >
              Open trip →
            </button>
          </form>
        </div>

        <div className="mt-16 grid gap-6 sm:mt-24 sm:grid-cols-4">
          <Feature emoji="🛏️" title="Hotel" body="Where you sleep." />
          <Feature emoji="🍽️" title="Food" body="Where you eat." />
          <Feature emoji="🍸" title="Drink" body="Where you sit." />
          <Feature emoji="🎒" title="Activity" body="Where you go." />
        </div>

        <div className="mt-20 text-[10px] uppercase tracking-[0.28em] text-muted">
          A → B → C → home
        </div>
      </div>
    </main>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
      {children}
    </div>
  );
}

function Feature({
  emoji,
  title,
  body,
}: {
  emoji: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-3xl border border-line bg-cream p-5 shadow-soft">
      <div className="text-3xl">{emoji}</div>
      <h3 className="mt-2 font-serif text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </div>
  );
}
