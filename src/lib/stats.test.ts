import { describe, expect, it } from "vitest";
import { breakdown, heatmap, streaks, summary, toLocalDate } from "./stats";
import { mkProblem } from "@/test/fixtures/problems";

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).toISOString();

describe("streaks", () => {
  it("counts the current run ending today", () => {
    const done = [at(2026, 10, 1), at(2026, 10, 2), at(2026, 10, 2, 20), at(2026, 10, 3)];
    expect(streaks(done, "2026-10-03")).toEqual({ current: 3, longest: 3 });
  });
  it("keeps the run alive if nothing yet today", () => {
    expect(streaks([at(2026, 10, 1), at(2026, 10, 2)], "2026-10-03").current).toBe(2);
  });
  it("breaks after a missed day", () => {
    const done = [at(2026, 9, 1), at(2026, 9, 2), at(2026, 9, 3), at(2026, 9, 4), at(2026, 10, 1)];
    expect(streaks(done, "2026-10-03")).toEqual({ current: 0, longest: 4 });
  });
  it("handles no data", () => {
    expect(streaks([], "2026-10-03")).toEqual({ current: 0, longest: 0 });
  });
});

describe("heatmap", () => {
  it("buckets completions by local date", () => {
    expect(heatmap([at(2026, 10, 1), at(2026, 10, 1, 22), at(2026, 10, 2)])).toEqual(
      new Map([["2026-10-01", 2], ["2026-10-02", 1]]),
    );
    expect(toLocalDate(at(2026, 10, 1, 23))).toBe("2026-10-01");
  });
});

describe("summary / breakdown", () => {
  const ps = [
    mkProblem({ difficulty: "Basic", companies: ["Google"], day_no: 1, done_at: at(2026, 10, 1) }),
    mkProblem({ difficulty: "Basic", companies: ["Google", "Meta"], day_no: 2, starred: true }),
    mkProblem({ difficulty: "Pro", companies: ["Meta"], day_no: 5 }),
  ];
  it("summarises progress and pace", () => {
    expect(summary(ps, 3)).toEqual({ total: 3, done: 1, starred: 1, scheduledSoFar: 2, overdue: 1 });
    expect(summary(ps, null).scheduledSoFar).toBe(0);
  });
  it("breaks down by key with done counts", () => {
    expect(breakdown(ps, (p) => [p.difficulty ?? "None"])).toEqual([
      { key: "Basic", total: 2, done: 1 },
      { key: "Pro", total: 1, done: 0 },
    ]);
    expect(breakdown(ps, (p) => p.companies)[0]).toEqual({ key: "Google", total: 2, done: 1 });
  });
});
