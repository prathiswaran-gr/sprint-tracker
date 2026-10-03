import { describe, expect, it } from "vitest";
import { currentPlanDay, dayToDate, makeSprintForDay, shiftBacklog, type ScheduleConfig } from "./schedule";

// 2026-10-01 is a Thursday.
const base: ScheduleConfig = { startDate: "2026-10-01", skipWeekends: false, restDays: [] };

describe("dayToDate", () => {
  it("returns null without a start date", () => {
    expect(dayToDate(1, { ...base, startDate: null })).toBeNull();
  });
  it("maps consecutive days", () => {
    expect(dayToDate(1, base)).toBe("2026-10-01");
    expect(dayToDate(5, base)).toBe("2026-10-05");
  });
  it("skips weekends", () => {
    const cfg = { ...base, skipWeekends: true };
    expect(dayToDate(2, cfg)).toBe("2026-10-02"); // Fri
    expect(dayToDate(3, cfg)).toBe("2026-10-05"); // Mon
  });
  it("skips rest days", () => {
    expect(dayToDate(2, { ...base, restDays: ["2026-10-02"] })).toBe("2026-10-03");
  });
  it("moves start forward when the start itself is a weekend", () => {
    expect(dayToDate(1, { ...base, startDate: "2026-10-03", skipWeekends: true })).toBe("2026-10-05");
  });
});

describe("currentPlanDay", () => {
  it("is null without a start date", () => {
    expect(currentPlanDay({ ...base, startDate: null }, "2026-10-05")).toBeNull();
  });
  it("is 1 before the start", () => {
    expect(currentPlanDay(base, "2026-09-20")).toEqual({ day: 1, isWorkingDay: false });
  });
  it("counts working days through today", () => {
    expect(currentPlanDay(base, "2026-10-03")).toEqual({ day: 3, isWorkingDay: true });
  });
  it("on a weekend points at the next working day", () => {
    expect(currentPlanDay({ ...base, skipWeekends: true }, "2026-10-03")).toEqual({ day: 3, isWorkingDay: false });
  });
});

describe("makeSprintForDay", () => {
  const sprintFor = makeSprintForDay([
    { original_day_no: 1, sprint_no: 1 },
    { original_day_no: 7, sprint_no: 1 },
    { original_day_no: 8, sprint_no: 2 },
  ]);
  it("uses original mapping, carrying forward past the end", () => {
    expect(sprintFor(1)).toBe(1);
    expect(sprintFor(5)).toBe(1);
    expect(sprintFor(8)).toBe(2);
    expect(sprintFor(99)).toBe(2);
  });
});

describe("makeSprintForDay after a shift", () => {
  it("prefers the original sprint over the rescheduled one", () => {
    const sprintFor = makeSprintForDay([{ original_day_no: 5, sprint_no: 2, original_sprint_no: 1 }]);
    expect(sprintFor(5)).toBe(1);
  });
});

describe("shiftBacklog", () => {
  const p = (id: string, day_no: number, done = false) => ({ id, day_no, done_at: done ? "x" : null });
  const sprintFor = (d: number) => (d <= 7 ? 1 : 2);

  it("shifts undone items from the earliest missed day, keeping spacing", () => {
    const changes = shiftBacklog([p("a", 2, true), p("b", 3), p("c", 4), p("d", 6), p("e", 3, true)], 5, sprintFor);
    expect(changes).toEqual([
      { id: "b", day_no: 5, sprint_no: 1 },
      { id: "c", day_no: 6, sprint_no: 1 },
      { id: "d", day_no: 8, sprint_no: 2 },
    ]);
  });
  it("is a no-op with nothing overdue", () => {
    expect(shiftBacklog([p("a", 2, true), p("b", 5)], 5, sprintFor)).toEqual([]);
  });
});
