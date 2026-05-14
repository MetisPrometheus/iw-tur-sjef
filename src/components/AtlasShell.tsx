"use client";

import { useEffect, useMemo, useState } from "react";
import type { Category, TripBundle } from "@/lib/types";
import TripMap from "./TripMap";
import TitlePlate from "./TitlePlate";
import TopRail from "./TopRail";
import TripSheet, { type SheetState } from "./TripSheet";
import AddStopModal from "./AddStopModal";
import BrowseBar from "./BrowseBar";
import PlannerButton from "./PlannerButton";
import type {
  GhostPlace,
  PopupAction,
  SelectedPin,
} from "./MapPopupContent";

type BrowseState = {
  stopId: string;
  category: Category;
  anchorName: string;
  anchorLat: number;
  anchorLng: number;
  keyword: string | null;
  loading: boolean;
  places: GhostPlace[];
};

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
  const [activeCategory, setActiveCategory] = useState<Category>("hotel");
  const [sheetState, setSheetState] = useState<SheetState>("peek");
  const [addingStop, setAddingStop] = useState(false);
  const [selectedPin, setSelectedPin] = useState<SelectedPin | null>(null);
  const [browse, setBrowse] = useState<BrowseState | null>(null);
  const [focusSuggestionId, setFocusSuggestionId] = useState<string | null>(null);

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

  const ghostsVisible = useMemo(() => {
    if (!browse) return [];
    const taken = new Set(
      bundle.suggestions
        .filter((s) => s.place_id)
        .map((s) => s.place_id as string),
    );
    return browse.places.filter((p) => !taken.has(p.place_id));
  }, [browse, bundle.suggestions]);

  async function renameTrip(newName: string) {
    await fetch(`/api/trips/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    mutate();
  }

  async function fetchBrowse(
    stopId: string,
    category: Category,
    lat: number,
    lng: number,
    anchorName: string,
    keyword: string | null,
  ) {
    setBrowse({
      stopId,
      category,
      anchorName,
      anchorLat: lat,
      anchorLng: lng,
      keyword,
      loading: true,
      places: [],
    });
    try {
      const u = new URL("/api/places/nearby", window.location.origin);
      u.searchParams.set("lat", String(lat));
      u.searchParams.set("lng", String(lng));
      u.searchParams.set("category", category);
      if (keyword) u.searchParams.set("q", keyword);
      const r = await fetch(u.toString());
      const data = (await r.json()) as { places: Omit<GhostPlace, "category">[] };
      // Rank by rating desc (places with no rating go last). Cap to 10.
      const ranked = (data.places ?? [])
        .slice()
        .sort((a, b) => {
          const ra = a.rating == null ? -1 : Number(a.rating);
          const rb = b.rating == null ? -1 : Number(b.rating);
          return rb - ra;
        })
        .slice(0, 10)
        .map((p) => ({ ...p, category }));
      setBrowse((prev) =>
        prev && prev.stopId === stopId && prev.category === category
          ? { ...prev, places: ranked, loading: false }
          : prev,
      );
    } catch {
      setBrowse((prev) => (prev ? { ...prev, loading: false } : prev));
    }
  }

  function enterBrowse(
    stopId: string,
    category: Category,
    anchorLat: number,
    anchorLng: number,
    anchorName: string,
  ) {
    setSelectedPin(null);
    void fetchBrowse(stopId, category, anchorLat, anchorLng, anchorName, null);
  }

  function searchInBrowse(q: string | null) {
    if (!browse) return;
    void fetchBrowse(
      browse.stopId,
      browse.category,
      browse.anchorLat,
      browse.anchorLng,
      browse.anchorName,
      q,
    );
  }

  function exitBrowse() {
    setBrowse(null);
  }

  async function addGhostPlace(place: GhostPlace) {
    if (!participantId || !browse) return;
    await fetch(`/api/trips/${slug}/suggestions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stop_id: browse.stopId,
        added_by: participantId,
        category: browse.category,
        is_pinned: true,
        place_id: place.place_id,
        name: place.name,
        address: place.address,
        lat: place.lat,
        lng: place.lng,
        rating: place.rating,
        photo_ref: place.photo_ref,
        url: place.url,
      }),
    });
    setSelectedPin(null);
    mutate();
  }

  async function handleAction(action: PopupAction) {
    if (action.type === "browseFromStop") {
      const stop = bundle.stops.find((s) => s.id === action.stopId);
      if (!stop) return;
      setActiveStopId(stop.id);
      setActiveCategory(action.category);
      enterBrowse(stop.id, action.category, stop.lat, stop.lng, stop.name);
    } else if (action.type === "browseFromHotel") {
      const hotel = bundle.suggestions.find((s) => s.id === action.hotelId);
      if (!hotel || hotel.lat == null || hotel.lng == null) return;
      setActiveStopId(hotel.stop_id);
      setActiveCategory(action.category);
      enterBrowse(
        hotel.stop_id,
        action.category,
        hotel.lat,
        hotel.lng,
        hotel.name,
      );
    } else if (action.type === "unpin") {
      const s = bundle.suggestions.find((x) => x.id === action.suggestionId);
      if (!s) return;
      await fetch(`/api/trips/${slug}/suggestions/${action.suggestionId}/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_pinned: !s.is_pinned }),
      });
      setSelectedPin(null);
      mutate();
    } else if (action.type === "addGhost") {
      await addGhostPlace(action.place);
    }
  }

  function handleSelectPin(pin: SelectedPin) {
    setSelectedPin(pin);
    if (pin.kind === "stop") {
      setActiveStopId(pin.stopId);
    } else if (pin.kind === "saved") {
      const s = bundle.suggestions.find((x) => x.id === pin.suggestionId);
      if (s) {
        setActiveStopId(s.stop_id);
        setActiveCategory(s.category);
        setFocusSuggestionId(s.id);
        setTimeout(() => setFocusSuggestionId(null), 2500);
      }
    }
  }

  function browseCategoryFromSheet(category: Category) {
    const stop = bundle.stops.find((s) => s.id === activeStopId);
    if (!stop) return;
    const hotel = bundle.suggestions.find(
      (s) =>
        s.stop_id === stop.id &&
        s.category === "hotel" &&
        s.is_pinned &&
        s.lat != null &&
        s.lng != null,
    );
    if (category !== "hotel" && hotel && hotel.lat && hotel.lng) {
      enterBrowse(stop.id, category, hotel.lat, hotel.lng, hotel.name);
    } else {
      enterBrowse(stop.id, category, stop.lat, stop.lng, stop.name);
    }
  }

  const pinnedCount = bundle.suggestions.filter((s) => s.is_pinned).length;
  const sheetOpen = sheetState !== "hidden";

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-ink">
      <TripMap
        bundle={bundle}
        ghosts={ghostsVisible}
        selectedPin={selectedPin}
        activeStopId={activeStopId}
        onSelectPin={handleSelectPin}
        onClosePopup={() => setSelectedPin(null)}
        onAction={handleAction}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-3 sm:p-4">
        <TitlePlate trip={bundle.trip} slug={slug} onRename={renameTrip} />
        <TopRail participants={bundle.participants} meId={participantId} />
      </div>

      <PlannerButton
        open={sheetOpen}
        pinnedCount={pinnedCount}
        stopCount={bundle.stops.length}
        onToggle={() =>
          setSheetState(sheetState === "hidden" ? "peek" : "hidden")
        }
      />

      {browse && (
        <BrowseBar
          category={browse.category}
          anchorName={browse.anchorName}
          loading={browse.loading}
          count={ghostsVisible.length}
          keyword={browse.keyword}
          onSearch={searchInBrowse}
          onExit={exitBrowse}
        />
      )}

      <TripSheet
        bundle={bundle}
        slug={slug}
        meId={participantId}
        activeStopId={activeStopId}
        activeCategory={activeCategory}
        sheetState={sheetState}
        onSheetStateChange={setSheetState}
        onPickStop={setActiveStopId}
        onPickCategory={setActiveCategory}
        onAddStop={() => setAddingStop(true)}
        onBrowseCategory={browseCategoryFromSheet}
        onMutated={mutate}
        focusSuggestionId={focusSuggestionId}
        onClearFocus={() => setFocusSuggestionId(null)}
        browse={
          browse
            ? {
                category: browse.category,
                anchorName: browse.anchorName,
                loading: browse.loading,
                places: ghostsVisible,
              }
            : null
        }
        onBrowseAdd={addGhostPlace}
        onBrowseFocusOnMap={(placeId) =>
          setSelectedPin({ kind: "ghost", placeId })
        }
      />

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
