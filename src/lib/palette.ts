// Friendly, distinguishable participant colors. First-come-first-served when joining.
export const PARTICIPANT_PALETTE = [
  "#e07a5f",
  "#3d5a80",
  "#81b29a",
  "#9b5de5",
  "#e0a458",
  "#5b6f4a",
  "#3a6ea5",
  "#b85c38",
  "#ef476f",
  "#118ab2",
  "#06d6a0",
  "#7b2cbf",
];

export function nextColor(taken: string[]): string {
  const free = PARTICIPANT_PALETTE.find((c) => !taken.includes(c));
  if (free) return free;
  // Wrap if the trip has more friends than the palette.
  return PARTICIPANT_PALETTE[taken.length % PARTICIPANT_PALETTE.length];
}
