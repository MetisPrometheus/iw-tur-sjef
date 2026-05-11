"use client";

import { useState } from "react";

export default function NameGate({ onSubmit }: { onSubmit: (name: string) => void }) {
  const [name, setName] = useState("");

  return (
    <main className="grid min-h-screen place-items-center bg-cream px-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) onSubmit(name.trim());
        }}
        className="w-full max-w-md rounded-2xl border border-dust bg-white p-8 shadow-card"
      >
        <div className="text-xs uppercase tracking-[0.2em] text-moss/80">welcome</div>
        <h1 className="mt-2 text-2xl font-semibold">What should we call you?</h1>
        <p className="mt-2 text-sm text-ink/60">
          Just a display name so the others know whose suggestion is whose.
          Stays on your device.
        </p>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          placeholder="Ivar"
          className="mt-5 w-full rounded-lg border border-dust bg-sand/40 px-3 py-2 outline-none focus:border-moss"
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="mt-4 w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-cream disabled:opacity-40"
        >
          Join the trip →
        </button>
      </form>
    </main>
  );
}
