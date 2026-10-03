/** Human-friendly plan length: "136 days · ~19 weeks". */
export function formatDuration(days: number): string {
  if (days <= 0) return "No schedule";
  if (days === 1) return "1 day";
  if (days < 7) return `${days} days`;
  if (days < 180) {
    const weeks = days / 7;
    return `${days} days · ${Number.isInteger(weeks) ? "" : "~"}${Math.round(weeks)} weeks`;
  }
  return `${days} days · ~${Math.round(days / 30)} months`;
}
