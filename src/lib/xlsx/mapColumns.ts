import type { Difficulty, ProblemInput } from "@/lib/types";
import type { ParsedSheet } from "./parse";

export const FIELDS = ["name", "url", "subject", "difficulty", "companies", "topics", "sprint", "day"] as const;
export type Field = (typeof FIELDS)[number];
export type ColumnMapping = Partial<Record<Field, number>>;

export const FIELD_LABELS: Record<Field, string> = {
  name: "Name", url: "URL", subject: "Subject", difficulty: "Difficulty",
  companies: "Companies", topics: "Topics", sprint: "Sprint", day: "Day",
};

const ALIASES: Record<Field, string[]> = {
  name: ["name", "problem", "problemname", "title", "question", "task"],
  url: ["url", "link", "problemlink", "href"],
  subject: ["subject", "category", "track"],
  difficulty: ["difficulty", "level", "diff"],
  companies: ["companies", "company", "companytags", "askedin"],
  topics: ["topics", "topic", "tags", "tag", "pattern"],
  sprint: ["sprint", "sprintno", "week", "phase"],
  day: ["day", "dayno", "daynumber"],
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

export function detectMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const used = new Set<number>();
  for (const field of FIELDS) {
    const idx = headers.findIndex((h, i) => !used.has(i) && ALIASES[field].includes(norm(h)));
    if (idx !== -1) {
      mapping[field] = idx;
      used.add(idx);
    }
  }
  return mapping;
}

const DIFFICULTY: Record<string, Difficulty> = {
  basic: "Basic", easy: "Basic", core: "Core", medium: "Core", pro: "Pro", hard: "Pro",
};

const splitList = (s: string) => [...new Set(s.split(/[|,]/).map((x) => x.trim()).filter(Boolean))];

const toInt = (s: string): number | null => {
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export function toProblems(sheet: ParsedSheet, mapping: ColumnMapping) {
  if (mapping.name == null) throw new Error("A Name column is required");
  const warnings: string[] = [];
  const problems: ProblemInput[] = [];
  let missingDay = 0;
  let badDifficulty = 0;

  const get = (values: string[], f: Field) => (mapping[f] == null ? "" : (values[mapping[f]!] ?? ""));

  for (const row of sheet.rows) {
    const name = get(row.values, "name");
    if (!name) continue;
    const urlIdx = mapping.url;
    const url =
      get(row.values, "url") || (urlIdx != null ? row.links[urlIdx] : undefined) || row.links[mapping.name] || "";
    const rawDiff = get(row.values, "difficulty");
    const difficulty = DIFFICULTY[norm(rawDiff)] ?? null;
    if (rawDiff && !difficulty) badDifficulty++;
    const day = toInt(get(row.values, "day"));
    if (day == null) missingDay++;

    problems.push({
      position: problems.length,
      name,
      url,
      subject: get(row.values, "subject").toLowerCase(),
      difficulty,
      companies: splitList(get(row.values, "companies")),
      topics: splitList(get(row.values, "topics")),
      sprint_no: toInt(get(row.values, "sprint")) ?? 1,
      day_no: day ?? 1,
    });
  }

  if (missingDay) warnings.push(`${missingDay} row(s) had no valid Day — placed on Day 1.`);
  if (badDifficulty) warnings.push(`${badDifficulty} row(s) had an unrecognized Difficulty — left blank.`);
  return { problems, warnings };
}
