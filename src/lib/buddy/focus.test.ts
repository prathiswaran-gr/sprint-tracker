import { describe, expect, it } from "vitest";
import { BREAK_MS, FOCUS_MS, formatClock, isOver, pause, remaining, resume, startPhase } from "./focus";

describe("focus", () => {
  it("starts a 25-min focus and a 5-min break", () => {
    expect(startPhase("focus", 1000)).toEqual({ phase: "focus", endsAt: 1000 + FOCUS_MS, pausedRemaining: null });
    expect(startPhase("break", 0).endsAt).toBe(BREAK_MS);
  });

  it("pause freezes the remaining time and resume continues from it", () => {
    const p = pause(startPhase("focus", 0), 60_000);
    expect(p.endsAt).toBeNull();
    expect(remaining(p, 10_000_000)).toBe(FOCUS_MS - 60_000);
    const r = resume(p, 100_000);
    expect(r).toEqual({ phase: "focus", endsAt: 100_000 + FOCUS_MS - 60_000, pausedRemaining: null });
  });

  it("pause and resume are no-ops in the wrong state", () => {
    const s = startPhase("focus", 0);
    expect(resume(s, 5)).toBe(s);
    const p = pause(s, 5);
    expect(pause(p, 9)).toBe(p);
  });

  it("never reports negative time and flips isOver at endsAt", () => {
    const s = startPhase("break", 0);
    expect(remaining(s, BREAK_MS + 5000)).toBe(0);
    expect(isOver(s, BREAK_MS - 1)).toBe(false);
    expect(isOver(s, BREAK_MS)).toBe(true);
    expect(isOver(pause(s, 10), BREAK_MS * 2)).toBe(false);
  });

  it("formats m:ss rounding up partial seconds", () => {
    expect(formatClock(FOCUS_MS)).toBe("25:00");
    expect(formatClock(61_000)).toBe("1:01");
    expect(formatClock(500)).toBe("0:01");
    expect(formatClock(0)).toBe("0:00");
  });
});
