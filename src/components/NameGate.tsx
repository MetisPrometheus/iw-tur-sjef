"use client";

import { useState } from "react";

export default function NameGate({ onSubmit }: { onSubmit: (name: string) => void }) {
  const [name, setName] = useState("");

  return (
    <main className="grain grid min-h-[100dvh] place-items-center bg-cream px-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) onSubmit(name.trim());
        }}
        className="w-full max-w-md rounded-4xl border border-line bg-cream p-7 shadow-lift sm:p-9"
      >
        <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-rust-dark">
          Welcome aboard
        </div>
        <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight tracking-tight">
          What should we call you?
        </h1>
        <p className="mt-3 text-sm text-muted">
          Just a name so the crew knows whose suggestion is whose. Stays on this device.
        </p>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          placeholder="Ivar"
          className="mt-6 w-full rounded-2xl border border-line bg-cream px-4 py-3 text-base outline-none focus:border-rust"
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="mt-3 w-full rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-cream transition active:scale-[0.98] disabled:opacity-40"
        >
          Join the trip →
        </button>
      </form>
    </main>
  );
}
