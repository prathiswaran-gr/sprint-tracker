export const MAANG = ["Meta", "Apple", "Amazon", "Netflix", "Google"] as const;

const isMaang = (name: string) => (MAANG as readonly string[]).includes(name);

/** MAANG coverage (fixed order) plus the most frequent other companies. */
export function summarizeCompanies(counts: Record<string, number>, topN = 6) {
  const maang = MAANG.map((name) => ({ name, covered: (counts[name] ?? 0) > 0, count: counts[name] ?? 0 }));
  const others = Object.entries(counts)
    .filter(([name]) => !isMaang(name))
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, topN);
  return { maang, maangCovered: maang.filter((m) => m.covered).length, others, total: Object.keys(counts).length };
}
