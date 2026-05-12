// Friendly participant colors that work well on cream surfaces.
export const PARTICIPANT_PALETTE = [
  "#c4633c", // rust
  "#7c9885", // sage
  "#dba94f", // honey
  "#6883a6", // dusty blue
  "#b06da5", // mauve
  "#84a98c", // moss
  "#d97757", // terracotta
  "#5f7470", // pine
  "#9c6644", // walnut
  "#a8c0a3", // mint
  "#8b5cf6", // violet
  "#0e7490", // teal-deep
];

export function nextColor(taken: string[]): string {
  const free = PARTICIPANT_PALETTE.find((c) => !taken.includes(c));
  if (free) return free;
  return PARTICIPANT_PALETTE[taken.length % PARTICIPANT_PALETTE.length];
}
