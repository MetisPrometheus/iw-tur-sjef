"use client";

import { useState } from "react";

export default function NameGate({ onSubmit }: { onSubmit: (name: string) => void }) {
  const [name, setName] = useState("");

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-soft px-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) onSubmit(name.trim());
        }}
        className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8"
      >
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-dark">
          welcome
        </div>
        <h1 className="mt-2 text-2xl font-semibold">What should we call you?</h1>
        <p className="mt-2 text-sm text-muted">
          Just a display name so the others know whose suggestion is whose.
          Stays on your device.
        </p>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          placeholder="Ivar"
          className="mt-5 w-full rounded-lg border border-line bg-soft px-3 py-2.5 outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="mt-4 w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white transition hover:bg-ink/90 disabled:opacity-40"
        >
          Join the trip →
        </button>
      </form>
    </main>
  );
}
