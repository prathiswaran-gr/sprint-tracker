import { describe, expect, it } from "vitest";
import { dayStats, greetingSituation, milestone, salutation, scheduleStatus, shouldIdleNudge } from "./triggers";

// Local-time timestamps so day bucketing is timezone-independent.
const at = (day: number, h = 10, m = 0) => new Date(2026, 9, day, h, m).toISOString();
const TODAY = "2026-10-13";
const s = (p: Partial<{ today: number; yesterday: number; streak: number; total: number }>) => ({
  today: 0, yesterday: 0, streak: 0, total: 10, ...p,
});

describe("dayStats", () => {
  it("counts today, yesterday and the current streak", () => {
    expect(dayStats([at(13), at(13), at(12), at(11)], TODAY)).toEqual({ today: 2, yesterday: 1, streak: 3, total: 4 });
  });

  it("buckets solves around midnight by local day", () => {
    expect(dayStats([at(13, 0, 5), at(12, 23, 55)], TODAY)).toMatchObject({ today: 1, yesterday: 1 });
  });
});

describe("salutation", () => {
  it.each([[8, "Good morning"], [13, "Good afternoon"], [19, "Good evening"], [2, "Hey night owl"], [23, "Hey night owl"]])(
    "%i → %s",
    (h, out) => expect(salutation(h)).toBe(out),
  );
});

describe("greetingSituation", () => {
  it("picks the right situation", () => {
    expect(greetingSituation(s({ total: 0 }), 10)).toBe("greet.start");
    expect(greetingSituation(s({ today: 3, yesterday: 2 }), 10)).toBe("greet.beatYesterday");
    expect(greetingSituation(s({ today: 2, yesterday: 2 }), 10)).toBe("greet.tied");
    expect(greetingSituation(s({ streak: 4 }), 19)).toBe("greet.streakRisk");
    expect(greetingSituation(s({ streak: 4 }), 10)).toBe("greet.chase");
    expect(greetingSituation(s({ today: 1, yesterday: 3 }), 10)).toBe("greet.chase");
  });
});

describe("milestone", () => {
  it("ranks celebrations", () => {
    expect(milestone(s({}))).toBe("solve.firstToday");
    expect(milestone(s({ streak: 3 }))).toBe("solve.streakUp");
    expect(milestone(s({ today: 1, yesterday: 2 }))).toBe("solve.tieYesterday");
    expect(milestone(s({ today: 2, yesterday: 2 }))).toBe("solve.beatYesterday");
    expect(milestone(s({ today: 4 }))).toBe("solve.count5");
    expect(milestone(s({ today: 9 }))).toBe("solve.count10");
    expect(milestone(s({ today: 14 }))).toBe("solve.count15");
    expect(milestone(s({ today: 2 }))).toBe("solve.plain");
  });
});

describe("scheduleStatus", () => {
  const cfg = { startDate: "2026-10-09", skipWeekends: false, restDays: [] as string[] }; // today = day 5
  const p = (day_no: number, done_at: string | null = null) => ({ day_no, done_at });

  it("reports how far behind the plan the user is", () => {
    expect(scheduleStatus(cfg, [p(1, at(10)), p(2), p(3), p(5)], TODAY)).toEqual({ kind: "behind", planned: 5, working: 2, behind: 2 });
  });

  it("reports ahead and on track", () => {
    const done = [1, 2, 3, 4, 5].map((d) => p(d, at(8 + d)));
    expect(scheduleStatus(cfg, [...done, p(6), p(7)], TODAY)).toEqual({ kind: "ahead", planned: 5, working: 6 });
    expect(scheduleStatus(cfg, [...done.slice(0, 4), p(5)], TODAY)).toEqual({ kind: "onTrack", planned: 5, working: 5 });
  });

  it("knows rest days", () => {
    expect(scheduleStatus({ ...cfg, restDays: [TODAY] }, [p(1), p(9)], TODAY)).toEqual({ kind: "restDay" });
  });

  it("stays quiet when there's nothing to say", () => {
    expect(scheduleStatus({ ...cfg, startDate: null }, [p(1)], TODAY)).toBeNull();
    expect(scheduleStatus({ ...cfg, startDate: "2026-10-20" }, [p(1)], TODAY)).toBeNull();
    expect(scheduleStatus(cfg, [], TODAY)).toBeNull();
    expect(scheduleStatus(cfg, [p(1, at(10))], TODAY)).toBeNull();
  });
});

describe("shouldIdleNudge", () => {
  const MIN = 60_000;
  const base = { now: 30 * MIN, lastActivity: 29 * MIN, idleSince: 0, lastNudgeAt: null };

  it("nudges an active user idle for 20+ minutes", () => expect(shouldIdleNudge(base)).toBe(true));
  it("waits the full 20 minutes", () => expect(shouldIdleNudge({ ...base, idleSince: 15 * MIN })).toBe(false));
  it("skips users who walked away", () => expect(shouldIdleNudge({ ...base, lastActivity: 0 })).toBe(false));
  it("rate-limits to one nudge per 30 minutes", () => {
    expect(shouldIdleNudge({ ...base, lastNudgeAt: 20 * MIN })).toBe(false);
    expect(shouldIdleNudge({ ...base, now: 60 * MIN, lastActivity: 59 * MIN, lastNudgeAt: 29 * MIN })).toBe(true);
  });
});
