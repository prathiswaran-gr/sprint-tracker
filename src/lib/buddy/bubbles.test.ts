import { describe, expect, it } from "vitest";
import { celebrateBubble, enqueue, focusEndBubble, greetingBubble, MAX_QUEUE, nudgeBubble, scheduleBubble, type Bubble } from "./bubbles";

const rng0 = { rng: () => 0, lastId: null };
const stats = (p: Partial<{ today: number; yesterday: number; streak: number; total: number }>) => ({
  today: 0, yesterday: 0, streak: 0, total: 9, ...p,
});

describe("greetingBubble", () => {
  it("greets by first name with today vs yesterday", () => {
    const b = greetingBubble(stats({ today: 1, yesterday: 3, streak: 2 }), "Prathis Waran", 9, rng0);
    expect(b).toMatchObject({ kind: "greeting", mood: "happy", text: "Good morning, Prathis! Yesterday 3 · Today 1 — 3 more to beat it." });
    expect(b.actions.map((a) => a.id)).toEqual(["startFocus", "dismiss"]);
  });

  it("reads naturally when the name is missing or an email", () => {
    expect(greetingBubble(stats({}), "", 9, rng0).text).toMatch(/^Good morning, there! /);
    expect(greetingBubble(stats({}), "foo@bar.com", 9, rng0).text).toMatch(/^Good morning, foo! /);
  });
});

describe("celebrateBubble", () => {
  it("confetti for milestones", () => {
    expect(celebrateBubble(stats({ today: 1, yesterday: 2 }), rng0)).toMatchObject({
      kind: "celebrate", mood: "cheer", confetti: true, text: "2 — tied with yesterday! One more for the win.",
    });
    expect(celebrateBubble(stats({ streak: 3 }), rng0).text).toBe("Streak extended to 4 days 🔥");
  });

  it("no confetti for plain solves", () => {
    expect(celebrateBubble(stats({ today: 2 }), rng0)).toMatchObject({ text: "Nice one!", confetti: false });
  });
});

describe("scheduleBubble", () => {
  it("pluralises the catch-up count and offers focus when behind", () => {
    const b = scheduleBubble({ kind: "behind", planned: 5, working: 2, behind: 1 }, rng0);
    expect(b).toMatchObject({ mood: "concerned", text: "Plan says day 5, you're on day 2 — 1 problem to catch up." });
    expect(b.actions.map((a) => a.id)).toEqual(["startFocus"]);
    expect(scheduleBubble({ kind: "restDay" }, rng0)).toMatchObject({ mood: "sleepy", actions: [] });
  });
});

describe("focusEndBubble", () => {
  it("offers a break after focus and a new round after a break", () => {
    expect(focusEndBubble("focus", rng0).actions.map((a) => a.id)).toEqual(["startBreak", "startFocus"]);
    expect(focusEndBubble("focus", rng0).confetti).toBe(true);
    expect(focusEndBubble("break", rng0).actions.map((a) => a.id)).toEqual(["startFocus"]);
  });
});

describe("enqueue", () => {
  const greet = greetingBubble(stats({}), "A", 9, rng0);
  const sched = scheduleBubble({ kind: "behind", planned: 5, working: 2, behind: 2 }, rng0);
  const solve = celebrateBubble(stats({}), rng0);
  const nudge = nudgeBubble(rng0);

  it("orders by priority and keeps one bubble per kind", () => {
    const q = enqueue(enqueue(enqueue([], nudge), solve), { ...solve, id: "x", text: "again" });
    expect(q.map((b) => [b.kind, b.text])).toEqual([["celebrate", "again"], ["nudge", nudge.text]]);
  });

  it(`caps the queue at ${MAX_QUEUE}`, () => {
    const focusEnd = focusEndBubble("focus", rng0);
    const q = [nudge, solve, focusEnd, greet].reduce<Bubble[]>(enqueue, []);
    expect(q.map((b) => b.kind)).toEqual(["celebrate", "focusEnd", "greeting"]);
  });

  it("merges greeting and schedule in either order", () => {
    for (const q of [enqueue(enqueue([], greet), sched), enqueue(enqueue([], sched), greet)]) {
      expect(q).toHaveLength(1);
      expect(q[0]).toMatchObject({ kind: "schedule", id: greet.id, mood: "concerned", text: `${greet.text}\n${sched.text}`, actions: greet.actions });
    }
  });
});
