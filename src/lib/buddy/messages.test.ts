import { describe, expect, it } from "vitest";
import { fill, MESSAGE_KEYS, pick, plural, poolSize } from "./messages";

describe("messages", () => {
  it("fills known vars and leaves unknown ones alone", () => {
    expect(fill("{a} and {b}", { a: 1 })).toBe("1 and {b}");
  });

  it("pluralises", () => {
    expect(plural(1, "problem")).toBe("1 problem");
    expect(plural(0, "problem")).toBe("0 problems");
  });

  it("picks deterministically with a seeded rng", () => {
    expect(pick("greet.chase", { yesterday: 3, today: 1, diff: 3 }, { rng: () => 0 })).toEqual({
      id: "greet.chase#0",
      text: "Yesterday 3 · Today 1 — 3 more to beat it.",
    });
  });

  it("never repeats the last message", () => {
    expect(pick("solve.plain", {}, { rng: () => 0, lastId: "solve.plain#0" }).id).toBe("solve.plain#1");
    const last = poolSize("solve.plain") - 1;
    expect(pick("solve.plain", {}, { rng: () => 0.9999, lastId: `solve.plain#${last}` }).id).toBe("solve.plain#0");
  });

  it("every template is fully filled by the standard vars", () => {
    const vars = { name: "A", today: 1, yesterday: 2, diff: 2, streak: 3, behind: "2 problems", planned: 5, working: 3 };
    for (const key of MESSAGE_KEYS) {
      for (let i = 0; i < poolSize(key); i++) {
        const { text } = pick(key, vars, { rng: () => i / poolSize(key) });
        expect(text, key).not.toMatch(/[{}]/);
      }
    }
  });
});
