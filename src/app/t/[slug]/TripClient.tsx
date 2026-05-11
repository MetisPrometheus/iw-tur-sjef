"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { getClientId, getDisplayName, setDisplayName } from "@/lib/client-id";
import type { TripBundle, DaySlot } from "@/lib/types";
import NameGate from "@/components/NameGate";
import Header from "@/components/Header";
import StopList from "@/components/StopList";
import SlotPanel from "@/components/SlotPanel";
import TripMap from "@/components/TripMap";

export default function TripClient({
  slug,
  initialName,
}: {
  slug: string;
  initialName: string;
}) {
  const [clientId, setClientId] = useState<string>("");
  const [name, setNameState] = useState<string | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);

  useEffect(() => {
    setClientId(getClientId());
    setNameState(getDisplayName());
  }, []);

  const { data, mutate, isLoading } = useSWR<TripBundle>(
    `/api/trips/${slug}`,
    fetcher,
    { refreshInterval: 3000, revalidateOnFocus: true },
  );

  // Join (or rejoin to refresh display name) once we know who we are.
  useEffect(() => {
    if (!clientId || !name || !data) return;
    const existing = data.participants.find((p) => p.client_id === clientId);
    if (existing && existing.display_name === name) {
      setParticipantId(existing.id);
      return;
    }
    void fetch(`/api/trips/${slug}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, display_name: name }),
    })
      .then((r) => r.json())
      .then((p: { id: string }) => {
        setParticipantId(p.id);
        void mutate();
      });
  }, [clientId, name, data, slug, mutate]);

  // Default selected slot = first one in chronological order.
  useEffect(() => {
    if (!data || activeSlotId) return;
    if (data.slots.length) setActiveSlotId(data.slots[0].id);
  }, [data, activeSlotId]);

  const activeSlot: DaySlot | null = useMemo(() => {
    if (!data || !activeSlotId) return null;
    return data.slots.find((s) => s.id === activeSlotId) ?? null;
  }, [data, activeSlotId]);

  if (!clientId) return null;
  if (!name) {
    return (
      <NameGate
        onSubmit={(n) => {
          setDisplayName(n);
          setNameState(n);
        }}
      />
    );
  }
  if (isLoading || !data) {
    return (
      <main className="grid min-h-screen place-items-center bg-cream text-ink/50">
        loading trip…
      </main>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-cream">
      <Header
        trip={data.trip}
        participants={data.participants}
        meId={participantId}
        slug={slug}
        onRename={async (newName) => {
          await fetch(`/api/trips/${slug}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newName }),
          });
          void mutate();
        }}
      />
      <div className="grid flex-1 grid-cols-[320px_minmax(0,1fr)_minmax(0,1fr)] overflow-hidden">
        <aside className="overflow-y-auto border-r border-dust bg-sand/30">
          <StopList
            bundle={data}
            slug={slug}
            activeSlotId={activeSlotId}
            onPickSlot={setActiveSlotId}
            onMutated={() => void mutate()}
          />
        </aside>
        <section className="overflow-y-auto">
          <SlotPanel
            bundle={data}
            slug={slug}
            slot={activeSlot}
            meId={participantId}
            onMutated={() => void mutate()}
          />
        </section>
        <section className="overflow-hidden border-l border-dust">
          <TripMap bundle={data} activeSlotId={activeSlotId} />
        </section>
      </div>
    </div>
  );
}
