import { describe, expect, it } from "vitest";
import { monthWeeks, periodMonths, periodStats, yearOptions } from "./calendar";

describe("monthWeeks", () => {
  it("splits a month into Sun→Sat week columns", () => {
    const oct = monthWeeks(2026, 9); // Oct 1 2026 is a Thursday
    expect(oct).toHaveLength(5);
    expect(oct[0]).toEqual([null, null, null, null, "2026-10-01", "2026-10-02", "2026-10-03"]);
    expect(oct[4]).toEqual(["2026-10-25", "2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31"]);
    expect(oct.flat().filter(Boolean)).toHaveLength(31);
  });

  it("pads the last week and handles February", () => {
    expect(monthWeeks(2026, 1)).toHaveLength(4); // Feb 2026 starts on Sunday
    const nov = monthWeeks(2026, 10); // Nov 30 2026 is a Monday
    expect(nov.at(-1)).toEqual(["2026-11-29", "2026-11-30", null, null, null, null, null]);
  });
});

describe("periodMonths", () => {
  it("covers Jan–Dec for a year", () => {
    const m = periodMonths(2025);
    expect(m).toHaveLength(12);
    expect(m[0]).toEqual({ year: 2025, month: 0 });
    expect(m.at(-1)).toEqual({ year: 2025, month: 11 });
  });
});

describe("periodStats", () => {
  const counts = new Map([
    ["2026-09-01", 2], ["2026-09-02", 1], ["2026-09-03", 4],
    ["2026-09-10", 1], ["2026-09-11", 1],
    ["2025-01-05", 9],
  ]);
  it("sums totals, active days and the longest run within the range", () => {
    expect(periodStats(counts, "2026-01-01", "2026-12-31")).toEqual({ total: 9, activeDays: 5, maxStreak: 3 });
  });
  it("clips to the range", () => {
    expect(periodStats(counts, "2026-09-03", "2026-09-10")).toEqual({ total: 5, activeDays: 2, maxStreak: 1 });
    expect(periodStats(counts, "2024-01-01", "2024-12-31")).toEqual({ total: 0, activeDays: 0, maxStreak: 0 });
  });
});

describe("yearOptions", () => {
  it("covers completions, start year and current year, newest first", () => {
    expect(yearOptions(["2025-12-30", "2026-01-02"], "2024-06-01", "2026-10-03")).toEqual([2026, 2025, 2024]);
  });
  it("defaults to the current year", () => {
    expect(yearOptions([], null, "2026-10-03")).toEqual([2026]);
  });
});
