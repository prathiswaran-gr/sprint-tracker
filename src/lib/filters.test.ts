import { describe, expect, it } from "vitest";
import { applyFilters, DEFAULT_FILTERS, facets, type Filters } from "./filters";
import { mkProblem } from "@/test/fixtures/problems";

const list = [
  mkProblem({ name: "Two Sum", difficulty: "Basic", companies: ["Google", "Amazon"], topics: ["Arrays", "Hashing"], day_no: 3 }),
  mkProblem({ name: "3 Sum", difficulty: "Core", companies: ["Google"], topics: ["Arrays"], day_no: 4, done_at: "2026-10-01T10:00:00Z" }),
  mkProblem({ name: "Reverse Pairs", difficulty: "Pro", companies: ["Adobe", "Amazon", "Meta"], topics: ["Arrays"], day_no: 7, starred: true }),
  mkProblem({ name: "What is OOPS", subject: "oops", difficulty: null, day_no: 8 }),
];
const f = (over: Partial<Filters>) => ({ ...DEFAULT_FILTERS, ...over });
const names = (ps: { name: string }[]) => ps.map((p) => p.name);

describe("applyFilters", () => {
  it("defaults keep everything in day order", () => {
    expect(names(applyFilters(list, DEFAULT_FILTERS))).toEqual(["Two Sum", "3 Sum", "Reverse Pairs", "What is OOPS"]);
  });
  it("searches name, company and topic", () => {
    expect(names(applyFilters(list, f({ q: "sum" })))).toEqual(["Two Sum", "3 Sum"]);
    expect(names(applyFilters(list, f({ q: "meta" })))).toEqual(["Reverse Pairs"]);
    expect(names(applyFilters(list, f({ q: "hashing" })))).toEqual(["Two Sum"]);
  });
  it("filters by company (any match)", () => {
    expect(names(applyFilters(list, f({ companies: ["Amazon", "Meta"] })))).toEqual(["Two Sum", "Reverse Pairs"]);
  });
  it("combines facets", () => {
    expect(names(applyFilters(list, f({ companies: ["Google"], difficulties: ["Core"], status: "done" })))).toEqual(["3 Sum"]);
    expect(names(applyFilters(list, f({ subjects: ["oops"] })))).toEqual(["What is OOPS"]);
    expect(names(applyFilters(list, f({ status: "starred" })))).toEqual(["Reverse Pairs"]);
    expect(names(applyFilters(list, f({ status: "todo", topics: ["Arrays"] })))).toEqual(["Two Sum", "Reverse Pairs"]);
  });
  it("sorts", () => {
    expect(names(applyFilters(list, f({ sort: "name" })))).toEqual(["3 Sum", "Reverse Pairs", "Two Sum", "What is OOPS"]);
    expect(names(applyFilters(list, f({ sort: "difficulty", dir: "desc" })))[0]).toBe("Reverse Pairs");
    expect(names(applyFilters(list, f({ sort: "companies", dir: "desc" })))[0]).toBe("Reverse Pairs");
    expect(names(applyFilters(list, f({ sort: "difficulty" })))).toEqual(["Two Sum", "3 Sum", "Reverse Pairs", "What is OOPS"]);
  });
});

describe("facets", () => {
  it("counts values, most common first", () => {
    const fx = facets(list);
    expect(fx.companies[0]).toEqual({ value: "Amazon", count: 2 });
    expect(fx.companies.map((c) => c.value)).toEqual(["Amazon", "Google", "Adobe", "Meta"]);
    expect(fx.topics[0]).toEqual({ value: "Arrays", count: 3 });
    expect(fx.subjects).toEqual([{ value: "dsa", count: 3 }, { value: "oops", count: 1 }]);
  });
});
