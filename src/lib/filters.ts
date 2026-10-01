import { z } from "zod";
import type { Problem } from "@/lib/types";

export const STATUSES = ["all", "todo", "done", "starred"] as const;
export const SORTS = ["day", "name", "difficulty", "companies", "done"] as const;

export const filtersSchema = z.object({
  q: z.string().default(""),
  subjects: z.array(z.string()).default([]),
  difficulties: z.array(z.string()).default([]),
  companies: z.array(z.string()).default([]),
  topics: z.array(z.string()).default([]),
  status: z.enum(STATUSES).default("all"),
  sort: z.enum(SORTS).default("day"),
  dir: z.enum(["asc", "desc"]).default("asc"),
});
export type Filters = z.infer<typeof filtersSchema>;
export const DEFAULT_FILTERS: Filters = filtersSchema.parse({});

const DIFF_RANK: Record<string, number> = { Basic: 1, Core: 2, Pro: 3 };

type Cmp = (a: Problem, b: Problem) => number;
const byDay: Cmp = (a, b) => a.day_no - b.day_no || a.position - b.position;
const COMPARATORS: Record<Filters["sort"], Cmp> = {
  day: byDay,
  name: (a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }),
  difficulty: (a, b) => (DIFF_RANK[a.difficulty ?? ""] ?? 9) - (DIFF_RANK[b.difficulty ?? ""] ?? 9),
  companies: (a, b) => a.companies.length - b.companies.length,
  done: (a, b) => (a.done_at ?? "9").localeCompare(b.done_at ?? "9"),
};

const hasAny = (values: string[], wanted: string[]) => !wanted.length || values.some((v) => wanted.includes(v));

export function matches(p: Problem, f: Filters): boolean {
  if (f.status === "todo" && p.done_at) return false;
  if (f.status === "done" && !p.done_at) return false;
  if (f.status === "starred" && !p.starred) return false;
  if (f.subjects.length && !f.subjects.includes(p.subject)) return false;
  if (f.difficulties.length && !f.difficulties.includes(p.difficulty ?? "None")) return false;
  if (!hasAny(p.companies, f.companies) || !hasAny(p.topics, f.topics)) return false;
  if (f.q) {
    const q = f.q.toLowerCase();
    const hay = [p.name, ...p.topics, ...p.companies].join("\n").toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

export function applyFilters(problems: Problem[], f: Filters): Problem[] {
  const cmp = COMPARATORS[f.sort];
  const sign = f.dir === "desc" ? -1 : 1;
  // Blank difficulties always sink to the bottom, regardless of direction.
  const blankLast = (a: Problem, b: Problem) =>
    f.sort === "difficulty" ? Number(!a.difficulty) - Number(!b.difficulty) : 0;
  return problems
    .filter((p) => matches(p, f))
    .sort((a, b) => blankLast(a, b) || sign * cmp(a, b) || byDay(a, b));
}

export function isFiltering(f: Filters) {
  return Boolean(f.q || f.subjects.length || f.difficulties.length || f.companies.length || f.topics.length || f.status !== "all");
}

export interface Facet {
  value: string;
  count: number;
}

function count(values: string[]): Facet[] {
  const m = new Map<string, number>();
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
  return [...m].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

export function facets(problems: Problem[]) {
  return {
    companies: count(problems.flatMap((p) => p.companies)),
    topics: count(problems.flatMap((p) => p.topics)),
    subjects: count(problems.map((p) => p.subject).filter(Boolean)),
    difficulties: count(problems.map((p) => p.difficulty ?? "None")),
  };
}
