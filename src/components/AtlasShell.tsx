"use client";

import { useEffect, useState } from "react";
import type { TripBundle } from "@/lib/types";
import TripMap from "./TripMap";
import TitlePlate from "./TitlePlate";
import TopRail from "./TopRail";
import TripSheet from "./TripSheet";
import AddStopModal from "./AddStopModal";

export default function AtlasShell({
  slug,
  clientId,
  name,
  bundle,
  mutate,
}: {
  slug: string;
  clientId: string;
  name: string;
  bundle: TripBundle;
  mutate: () => void;
}) {
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [addingStop, setAddingStop] = useState(false);

  useEffect(() => {
    if (!clientId || !name || !bundle) return;
    const existing = bundle.participants.find((p) => p.client_id === clientId);
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
        mutate();
      });
  }, [clientId, name, bundle, slug, mutate]);

  useEffect(() => {
    if (activeStopId && bundle.stops.some((s) => s.id === activeStopId)) return;
    setActiveStopId(bundle.stops[0]?.id ?? null);
  }, [bundle.stops, activeStopId]);

  async function renameTrip(newName: string) {
    await fetch(`/api/trips/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    mutate();
  }

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-ink">
      <TripMap
        bundle={bundle}
        activeStopId={activeStopId}
        onStopClick={(id) => setActiveStopId(id)}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-3 sm:p-4">
        <TitlePlate trip={bundle.trip} slug={slug} onRename={renameTrip} />
        <TopRail participants={bundle.participants} meId={participantId} />
      </div>

      <TripSheet
        bundle={bundle}
        slug={slug}
        meId={participantId}
        activeStopId={activeStopId}
        activeDate={activeDate}
        onPickStop={setActiveStopId}
        onPickDate={setActiveDate}
        onAddStop={() => setAddingStop(true)}
        onMutated={mutate}
      />

      <button
        onClick={() => setAddingStop(true)}
        className="pointer-events-auto fixed right-4 z-20 grid h-14 w-14 place-items-center rounded-full bg-rust text-2xl text-white shadow-lift transition active:scale-[0.94] md:hidden"
        style={{ bottom: "calc(36dvh + 0.75rem)" }}
        aria-label="Add stop"
      >
        ＋
      </button>

      {addingStop && (
        <AddStopModal
          slug={slug}
          onClose={() => setAddingStop(false)}
          onAdded={mutate}
        />
      )}
    </div>
  );
}
