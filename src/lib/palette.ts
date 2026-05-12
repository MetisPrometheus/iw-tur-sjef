// Friendly, distinguishable participant colors. First-come-first-served when joining.
export const PARTICIPANT_PALETTE = [
  "#10b981",
  "#6366f1",
  "#f43f5e",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#3b82f6",
  "#f97316",
  "#a855f7",
  "#14b8a6",
];

export function nextColor(taken: string[]): string {
  const free = PARTICIPANT_PALETTE.find((c) => !taken.includes(c));
  if (free) return free;
  return PARTICIPANT_PALETTE[taken.length % PARTICIPANT_PALETTE.length];
}
