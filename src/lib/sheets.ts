import type { PublicSheet } from "./types";

export const SHEET_SORTS = ["newest", "popular", "shortest", "largest"] as const;
export type SheetSort = (typeof SHEET_SORTS)[number];

const COMPARE: Record<SheetSort, (a: PublicSheet, b: PublicSheet) => number> = {
  newest: (a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""),
  popular: (a, b) => b.copy_count - a.copy_count,
  shortest: (a, b) => a.day_count - b.day_count,
  largest: (a, b) => b.problem_count - a.problem_count,
};

export function filterSheets(sheets: PublicSheet[], { q = "", company = "", sort = "newest" }: { q?: string; company?: string; sort?: SheetSort }) {
  const needle = q.trim().toLowerCase();
  return sheets
    .filter((s) => !company || (s.company_counts[company] ?? 0) > 0)
    .filter((s) => {
      if (!needle) return true;
      const hay = [s.title, s.description, ...s.topics, ...Object.keys(s.company_counts)].join("\n").toLowerCase();
      return hay.includes(needle);
    })
    .sort((a, b) => COMPARE[sort](a, b) || COMPARE.newest(a, b));
}
