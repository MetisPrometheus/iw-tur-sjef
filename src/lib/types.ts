export type SlotKind =
  | "breakfast"
  | "coffee"
  | "lunch"
  | "activity"
  | "dinner"
  | "drink"
  | "lodging"
  | "custom";

export const SLOT_KINDS: SlotKind[] = [
  "breakfast",
  "coffee",
  "lunch",
  "activity",
  "dinner",
  "drink",
  "lodging",
  "custom",
];

export const SLOT_LABEL: Record<SlotKind, string> = {
  breakfast: "Breakfast",
  coffee: "Coffee",
  lunch: "Lunch",
  activity: "Activity",
  dinner: "Dinner",
  drink: "Drinks",
  lodging: "Where to sleep",
  custom: "Other",
};

// Map our slot kinds to Google Places "type" / "includedType" hints.
export const SLOT_PLACE_TYPE: Record<SlotKind, string> = {
  breakfast: "cafe",
  coffee: "cafe",
  lunch: "restaurant",
  activity: "tourist_attraction",
  dinner: "restaurant",
  drink: "bar",
  lodging: "lodging",
  custom: "point_of_interest",
};

export const SLOT_COLOR: Record<SlotKind, string> = {
  breakfast: "#f59e0b",
  coffee: "#fb923c",
  lunch: "#f43f5e",
  activity: "#6366f1",
  dinner: "#ef4444",
  drink: "#8b5cf6",
  lodging: "#10b981",
  custom: "#94a3b8",
};

export type Trip = {
  id: string;
  slug: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type Participant = {
  id: string;
  trip_id: string;
  client_id: string;
  display_name: string;
  color: string;
  created_at: string;
};

export type Stop = {
  id: string;
  trip_id: string;
  order_index: number;
  name: string;
  lat: number;
  lng: number;
  arrival_date: string | null;
  depart_date: string | null;
};

export type DaySlot = {
  id: string;
  stop_id: string;
  date: string;
  kind: SlotKind;
  label: string | null;
  capacity: number;
  time_start: string | null;
  time_end: string | null;
  order_index: number;
};

export type Suggestion = {
  id: string;
  slot_id: string;
  added_by: string;
  place_id: string | null;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  rating: number | null;
  photo_ref: string | null;
  url: string | null;
  note: string | null;
  created_at: string;
};

export type Vote = {
  id: string;
  suggestion_id: string;
  participant_id: string;
  created_at: string;
};

export type TripBundle = {
  trip: Trip;
  participants: Participant[];
  stops: Stop[];
  slots: DaySlot[];
  suggestions: Suggestion[];
  votes: Vote[];
};
