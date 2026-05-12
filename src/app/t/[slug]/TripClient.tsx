"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import clsx from "clsx";
import { fetcher } from "@/lib/fetcher";
import { getClientId, getDisplayName, setDisplayName } from "@/lib/client-id";
import type { TripBundle, DaySlot } from "@/lib/types";
import NameGate from "@/components/NameGate";
import Header from "@/components/Header";
import StopList from "@/components/StopList";
import SlotPanel from "@/components/SlotPanel";
import TripMap from "@/components/TripMap";
import ViewToggle, { type ViewMode } from "@/components/ViewToggle";

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
  const [view, setView] = useState<ViewMode>("route");

  useEffect(() => {
    setClientId(getClientId());
    setNameState(getDisplayName());
  }, []);

  const { data, mutate, isLoading } = useSWR<TripBundle>(
    `/api/trips/${slug}`,
    fetcher,
    { refreshInterval: 3000, revalidateOnFocus: true },
  );

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
      <main className="grid min-h-screen place-items-center bg-soft text-muted">
        loading trip…
      </main>
    );
  }

  function pickSlot(id: string) {
    setActiveSlotId(id);
    setView("slot");
  }

  const badges = {
    route: data.stops.length,
    slot: activeSlot
      ? data.suggestions.filter((s) => s.slot_id === activeSlot.id).length
      : 0,
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-soft">
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

      {/* Mobile-only view toggle, just under the header. */}
      <div className="flex shrink-0 justify-center border-b border-line bg-white px-4 py-2 md:hidden">
        <ViewToggle value={view} onChange={setView} badges={badges} />
      </div>

      <div className="relative flex-1 overflow-hidden md:grid md:grid-cols-[280px_minmax(0,1fr)_minmax(380px,1fr)] lg:grid-cols-[300px_minmax(0,1fr)_minmax(520px,1.2fr)]">
        <aside
          className={clsx(
            "h-full overflow-y-auto border-line bg-white md:border-r",
            view === "route" ? "block" : "hidden md:block",
          )}
        >
          <StopList
            bundle={data}
            slug={slug}
            activeSlotId={activeSlotId}
            onPickSlot={pickSlot}
            onMutated={() => void mutate()}
          />
        </aside>

        <section
          className={clsx(
            "h-full overflow-y-auto bg-white md:bg-soft",
            view === "slot" ? "block" : "hidden md:block",
          )}
        >
          <SlotPanel
            bundle={data}
            slug={slug}
            slot={activeSlot}
            meId={participantId}
            onMutated={() => void mutate()}
          />
        </section>

        <section
          className={clsx(
            "relative h-full overflow-hidden border-line md:border-l",
            view === "map" ? "block" : "hidden md:block",
          )}
        >
          <TripMap bundle={data} activeSlotId={activeSlotId} />
        </section>
      </div>
    </div>
  );
}
