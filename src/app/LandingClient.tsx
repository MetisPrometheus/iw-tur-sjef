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
    <main className="relative min-h-[100dvh] overflow-hidden bg-soft">
      {/* Soft gradient blobs as background. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, #10b981 0%, transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)" }}
      />

      <div className="relative mx-auto max-w-3xl px-5 pt-14 pb-24 sm:px-6 sm:pt-20">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-dark">
          tur-sjef
        </div>
        <h1 className="mt-3 text-[2.5rem] font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          Plan a road trip,
          <br />
          <span className="bg-gradient-to-r from-brand to-indigo-500 bg-clip-text text-transparent">
            together.
          </span>
        </h1>
        <p className="mt-5 max-w-xl text-base text-slate-600 sm:mt-6 sm:text-lg">
          Drop in your stops, pull nearby gems from Google, let your friends pitch
          options for each meal, activity and overnight — then vote. Winners hit
          the map. No accounts, just a shareable link.
        </p>

        <div className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-6">
          <form
            onSubmit={create}
            className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6"
          >
            <h2 className="text-lg font-semibold">Start a new trip</h2>
            <p className="mt-1 text-sm text-muted">
              You&apos;ll get a link to share with the crew.
            </p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sør-Norge august"
              className="mt-4 w-full rounded-lg border border-line bg-soft px-3 py-2.5 outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
              maxLength={80}
            />
            <button
              type="submit"
              disabled={busy || !name.trim()}
              className="mt-4 w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white transition hover:bg-ink/90 disabled:opacity-40"
            >
              {busy ? "creating…" : "Create trip →"}
            </button>
            {err && <div className="mt-3 text-sm text-rose-600">{err}</div>}
          </form>

          <form
            onSubmit={join}
            className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6"
          >
            <h2 className="text-lg font-semibold">Join an existing one</h2>
            <p className="mt-1 text-sm text-muted">Paste the slug or full URL.</p>
            <input
              value={joinSlug}
              onChange={(e) => setJoinSlug(e.target.value)}
              placeholder="ab3kpq8m9d"
              className="mt-4 w-full rounded-lg border border-line bg-soft px-3 py-2.5 outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
            />
            <button
              type="submit"
              disabled={!joinSlug.trim()}
              className="mt-4 w-full rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-soft disabled:opacity-40"
            >
              Open trip →
            </button>
          </form>
        </div>

        <div className="mt-16 text-xs uppercase tracking-[0.22em] text-slate-400 sm:mt-20">
          A → B → C → home
        </div>
      </div>
    </main>
  );
}
