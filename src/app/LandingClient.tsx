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
    <main className="min-h-screen bg-cream">
      <div className="mx-auto max-w-3xl px-6 pt-20 pb-32">
        <div className="text-xs uppercase tracking-[0.2em] text-moss/80">tur-sjef</div>
        <h1 className="mt-3 text-5xl font-semibold leading-[1.05] tracking-tight">
          Plan a road trip,
          <br />
          <span className="text-rust">together.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-ink/70">
          Drop in your stops, pull nearby gems from Google, let your friends pitch
          options for each meal, activity and overnight — then vote. The winners
          land on the map. No accounts, just a shareable link.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          <form
            onSubmit={create}
            className="rounded-2xl border border-dust bg-white p-6 shadow-card"
          >
            <h2 className="text-lg font-semibold">Start a new trip</h2>
            <p className="mt-1 text-sm text-ink/60">
              You&apos;ll get a link to share with the crew.
            </p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sør-Norge august"
              className="mt-4 w-full rounded-lg border border-dust bg-sand/40 px-3 py-2 outline-none focus:border-moss"
              maxLength={80}
            />
            <button
              type="submit"
              disabled={busy || !name.trim()}
              className="mt-4 w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-cream disabled:opacity-40"
            >
              {busy ? "creating…" : "Create trip →"}
            </button>
            {err && <div className="mt-3 text-sm text-rust">{err}</div>}
          </form>

          <form
            onSubmit={join}
            className="rounded-2xl border border-dust bg-white p-6 shadow-card"
          >
            <h2 className="text-lg font-semibold">Join an existing one</h2>
            <p className="mt-1 text-sm text-ink/60">
              Paste the slug or the full URL.
            </p>
            <input
              value={joinSlug}
              onChange={(e) => setJoinSlug(e.target.value)}
              placeholder="ab3kpq8m9d"
              className="mt-4 w-full rounded-lg border border-dust bg-sand/40 px-3 py-2 outline-none focus:border-moss"
            />
            <button
              type="submit"
              disabled={!joinSlug.trim()}
              className="mt-4 w-full rounded-lg border border-ink/20 bg-cream px-4 py-2.5 text-sm font-medium disabled:opacity-40"
            >
              Open trip →
            </button>
          </form>
        </div>

        <div className="mt-20 text-xs uppercase tracking-[0.2em] text-ink/40">
          A → B → C → home
        </div>
      </div>
    </main>
  );
}
