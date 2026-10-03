import { describe, expect, it } from "vitest";
import type { PublicSheet } from "./types";
import { filterSheets } from "./sheets";

const sheet = (p: Partial<PublicSheet>): PublicSheet => ({
  id: "x", title: "", description: "", owner_name: null, owner_avatar: null, published_at: "2026-10-01T00:00:00Z",
  copy_count: 0, problem_count: 10, day_count: 10, sprint_count: 1, basic_count: 0, core_count: 0, pro_count: 0,
  topics: [], company_counts: {}, ...p,
});

const sheets = [
  sheet({ id: "a", title: "DSA Prep", topics: ["Arrays", "Graphs"], company_counts: { Google: 5 }, day_count: 136, copy_count: 3, published_at: "2026-09-01T00:00:00Z", problem_count: 600 }),
  sheet({ id: "b", title: "Blind 75", topics: ["Arrays"], company_counts: { Meta: 2, Zoho: 1 }, day_count: 30, copy_count: 9, published_at: "2026-10-02T00:00:00Z", problem_count: 75 }),
  sheet({ id: "c", title: "DBMS crash course", description: "SQL and normalization", day_count: 7, published_at: "2026-09-20T00:00:00Z", problem_count: 40 }),
];
const ids = (xs: PublicSheet[]) => xs.map((s) => s.id);

describe("filterSheets", () => {
  it("sorts newest first by default", () => {
    expect(ids(filterSheets(sheets, {}))).toEqual(["b", "c", "a"]);
  });
  it("searches title, description, topics and companies", () => {
    expect(ids(filterSheets(sheets, { q: "dsa" }))).toEqual(["a"]);
    expect(ids(filterSheets(sheets, { q: "sql" }))).toEqual(["c"]);
    expect(ids(filterSheets(sheets, { q: "graphs" }))).toEqual(["a"]);
    expect(ids(filterSheets(sheets, { q: "zoho" }))).toEqual(["b"]);
  });
  it("filters by company", () => {
    expect(ids(filterSheets(sheets, { company: "Meta" }))).toEqual(["b"]);
  });
  it("supports other sorts", () => {
    expect(ids(filterSheets(sheets, { sort: "popular" }))).toEqual(["b", "a", "c"]);
    expect(ids(filterSheets(sheets, { sort: "shortest" }))).toEqual(["c", "b", "a"]);
    expect(ids(filterSheets(sheets, { sort: "largest" }))).toEqual(["a", "b", "c"]);
  });
});
