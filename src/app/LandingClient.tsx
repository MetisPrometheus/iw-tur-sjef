"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [joinSlug, setJoinSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
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
        <h1 className="mt-4 font-serif text-[2.75rem] font-semibold leading-[1.02] tracking-tight sm:text-7xl">
          Plan the road,
          <br />
          <span className="italic text-rust">together.</span>
        </h1>
        <p className="mt-6 max-w-xl text-base text-ink/75 sm:text-lg">
          Drop your stops on a globe. Pull nearby gems from Google. Let your friends
          pitch what to eat, what to do, where to sleep — and vote. The winners hit
          the atlas. No accounts; just a link the crew shares.
        </p>

        <div className="mt-10 grid gap-5 sm:mt-14 sm:grid-cols-2 sm:gap-7">
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
            <p className="mt-1 text-sm text-muted">
              You&apos;ll get a slug to share with the crew.
            </p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lofoten i juli"
              className="mt-5 w-full rounded-2xl border border-line bg-cream px-4 py-3 text-base outline-none focus:border-rust"
              maxLength={80}
            />
            <button
              type="submit"
              disabled={busy || !name.trim()}
              className="mt-3 w-full rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-cream transition active:scale-[0.98] disabled:opacity-40"
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
            <p className="mt-1 text-sm text-muted">
              Paste the slug or the full URL.
            </p>
            <input
              value={joinSlug}
              onChange={(e) => setJoinSlug(e.target.value)}
              placeholder="ab3kpq8m9d"
              className="mt-5 w-full rounded-2xl border border-line bg-cream px-4 py-3 text-base outline-none focus:border-sage-dark"
            />
            <button
              type="submit"
              disabled={!joinSlug.trim()}
              className="mt-3 w-full rounded-2xl border border-line bg-cream px-4 py-3 text-sm font-semibold text-ink transition active:scale-[0.98] hover:bg-sand disabled:opacity-40"
            >
              Open trip →
            </button>
          </form>
        </div>

        <div className="mt-16 grid gap-6 sm:mt-24 sm:grid-cols-3">
          <Feature emoji="🌍" title="A globe, not a list">
            Your stops are pins on a real atlas. Mapbox 3D, road routing,
            zoom into the day you&apos;re planning.
          </Feature>
          <Feature emoji="🗳️" title="The crew decides">
            Everyone pitches options. Everyone votes. Highest-voted suggestion
            wins the slot — and lands on the map.
          </Feature>
          <Feature emoji="🥐" title="By the moment">
            Break each day into the bits that matter — breakfast, an activity,
            where to sleep — with a top-N limit per slot.
          </Feature>
        </div>

        <div className="mt-20 text-[10px] uppercase tracking-[0.28em] text-muted">
          A → B → C → home
        </div>
      </div>
    </main>
  );
}

function Feature({
  emoji,
  title,
  children,
}: {
  emoji: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-line bg-cream p-5 shadow-soft">
      <div className="text-3xl">{emoji}</div>
      <h3 className="mt-2 font-serif text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-1 text-sm text-muted">{children}</p>
    </div>
  );
}
