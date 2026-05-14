export type Category = "hotel" | "food" | "drink" | "activity";

export const CATEGORIES: Category[] = ["hotel", "food", "drink", "activity"];

export const CATEGORY_LABEL: Record<Category, string> = {
  hotel: "Hotel",
  food: "Food",
  drink: "Drinks",
  activity: "Activity",
};

export const CATEGORY_EMOJI: Record<Category, string> = {
  hotel: "🛏️",
  food: "🍽️",
  drink: "🍸",
  activity: "🎒",
};

export const CATEGORY_COLOR: Record<Category, string> = {
  hotel: "#10b981",
  food: "#f43f5e",
  drink: "#8b5cf6",
  activity: "#6366f1",
};

export const CATEGORY_PLACE_TYPE: Record<Category, string> = {
  hotel: "lodging",
  food: "restaurant",
  drink: "bar",
  activity: "tourist_attraction",
};

export type Trip = {
  id: string;
  slug: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  boss_client_id: string | null;
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
  start_date: string | null;
  end_date: string | null;
};

export type Suggestion = {
  id: string;
  stop_id: string;
  added_by: string;
  category: Category;
  is_pinned: boolean;
  is_done: boolean;
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

export type SplitKind = "equal" | "amounts";

export type Expense = {
  id: string;
  suggestion_id: string;
  amount: number;
  currency: string;
  paid_by: string;
  split_kind: SplitKind;
  note: string | null;
  created_at: string;
};

export type ExpenseSplit = {
  id: string;
  expense_id: string;
  participant_id: string;
  amount: number;
};

export type TripBundle = {
  trip: Trip;
  participants: Participant[];
  stops: Stop[];
  suggestions: Suggestion[];
  expenses: Expense[];
  splits: ExpenseSplit[];
};
