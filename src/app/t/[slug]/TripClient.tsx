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

type MobileTab = "route" | "slot" | "map";

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
  const [mobileTab, setMobileTab] = useState<MobileTab>("route");

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
    setMobileTab("slot");
  }

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

      {/* Panes. On mobile only one is visible at a time (via the tab bar). On md+, all three are side-by-side. */}
      <div className="flex-1 overflow-hidden md:grid md:grid-cols-[320px_minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[340px_minmax(0,1fr)_minmax(0,520px)]">
        <aside
          className={clsx(
            "h-full overflow-y-auto border-line bg-white md:border-r",
            mobileTab === "route" ? "block" : "hidden md:block",
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
            mobileTab === "slot" ? "block" : "hidden md:block",
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
            "h-full overflow-hidden border-line md:border-l",
            mobileTab === "map" ? "block" : "hidden md:block",
          )}
        >
          <TripMap bundle={data} activeSlotId={activeSlotId} />
        </section>
      </div>

      {/* Mobile bottom tab bar. */}
      <nav className="flex shrink-0 border-t border-line bg-white md:hidden">
        <MobileTabBtn
          active={mobileTab === "route"}
          onClick={() => setMobileTab("route")}
          icon="◆"
          label="Route"
          badge={data.stops.length}
        />
        <MobileTabBtn
          active={mobileTab === "slot"}
          onClick={() => setMobileTab("slot")}
          icon="✦"
          label={activeSlot ? "Slot" : "Pick"}
        />
        <MobileTabBtn
          active={mobileTab === "map"}
          onClick={() => setMobileTab("map")}
          icon="◉"
          label="Map"
        />
      </nav>
    </div>
  );
}

function MobileTabBtn({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium",
        active ? "text-ink" : "text-muted",
      )}
    >
      <span className="text-base leading-none">{icon}</span>
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute right-[28%] top-1.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-ink px-1 text-[9px] font-bold text-white">
          {badge}
        </span>
      )}
      {active && (
        <span className="absolute inset-x-6 top-0 h-0.5 rounded-b bg-ink" />
      )}
    </button>
  );
}
