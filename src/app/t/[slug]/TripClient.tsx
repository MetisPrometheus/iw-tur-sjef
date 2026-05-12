"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { getClientId, getDisplayName, setDisplayName } from "@/lib/client-id";
import type { TripBundle } from "@/lib/types";
import NameGate from "@/components/NameGate";
import AtlasShell from "@/components/AtlasShell";

export default function TripClient({
  slug,
  initialName: _initialName,
}: {
  slug: string;
  initialName: string;
}) {
  const [clientId, setClientId] = useState<string>("");
  const [name, setNameState] = useState<string | null>(null);

  useEffect(() => {
    setClientId(getClientId());
    setNameState(getDisplayName());
  }, []);

  const { data, mutate, isLoading } = useSWR<TripBundle>(
    `/api/trips/${slug}`,
    fetcher,
    { refreshInterval: 3000, revalidateOnFocus: true },
  );

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
      <main className="grid h-[100dvh] place-items-center bg-cream text-muted">
        <div className="text-center">
          <div className="text-4xl animate-shimmer">🌍</div>
          <div className="mt-3 font-serif text-lg">loading the atlas…</div>
        </div>
      </main>
    );
  }

  return <AtlasShell slug={slug} clientId={clientId} name={name} bundle={data} mutate={mutate} />;
}
