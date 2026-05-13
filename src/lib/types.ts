export type Category =
  | "food"
  | "coffee"
  | "activity"
  | "lodging"
  | "drinks"
  | "other";

export const CATEGORIES: Category[] = [
  "food",
  "coffee",
  "activity",
  "lodging",
  "drinks",
  "other",
];

export const CATEGORY_LABEL: Record<Category, string> = {
  food: "Food",
  coffee: "Coffee",
  activity: "Activity",
  lodging: "Stay",
  drinks: "Drinks",
  other: "Other",
};

export const CATEGORY_EMOJI: Record<Category, string> = {
  food: "🍽️",
  coffee: "☕",
  activity: "🎒",
  lodging: "🛏️",
  drinks: "🍸",
  other: "✨",
};

export const CATEGORY_COLOR: Record<Category, string> = {
  food: "#f43f5e",
  coffee: "#fb923c",
  activity: "#6366f1",
  lodging: "#10b981",
  drinks: "#8b5cf6",
  other: "#94a3b8",
};

// Google Places "primary type" we ask for given a chosen category.
// null means "no type filter" — for "Other" we just do a generic text search.
export const CATEGORY_PLACE_TYPE: Record<Category, string | null> = {
  food: "restaurant",
  coffee: "cafe",
  activity: "tourist_attraction",
  lodging: "lodging",
  drinks: "bar",
  other: null,
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

export type Day = {
  id: string;
  stop_id: string;
  date: string;
  label: string | null;
  capacity: number;
};

export type Suggestion = {
  id: string;
  day_id: string;
  added_by: string;
  category: Category | null;
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
  days: Day[];
  suggestions: Suggestion[];
  votes: Vote[];
};
