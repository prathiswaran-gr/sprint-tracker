import { describe, expect, it } from "vitest";
import { activityItems, dayLabel, solvedText } from "./activity";
import type { GroupActivityRow, GroupReaction } from "./types";

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).toISOString();
const ev = (user_id: string, problem_name: string, done_at: string): GroupActivityRow => ({ user_id, problem_name, done_at });
const clap = (target_user: string, day: string, reactor: string): GroupReaction => ({ group_id: "g", target_user, day, reactor });

describe("activityItems", () => {
  it("returns nothing for an empty feed", () => {
    expect(activityItems([], [], "me")).toEqual([]);
  });

  it("makes one item per member per local day, newest first", () => {
    const items = activityItems(
      [
        ev("a", "Two Sum", at(2026, 10, 4, 9)),
        ev("b", "LRU Cache", at(2026, 10, 5, 8)),
        ev("a", "3Sum", at(2026, 10, 5, 7)),
        ev("a", "Valid Anagram", at(2026, 10, 5, 10)),
      ],
      [],
      "me",
    );
    expect(items.map((i) => [i.user_id, i.day, i.count])).toEqual([
      ["a", "2026-10-05", 2],
      ["b", "2026-10-05", 1],
      ["a", "2026-10-04", 1],
    ]);
  });

  it("lists the two latest problem names and counts the rest", () => {
    const [item] = activityItems(
      [
        ev("a", "P1", at(2026, 10, 5, 8)),
        ev("a", "P2", at(2026, 10, 5, 9)),
        ev("a", "P3", at(2026, 10, 5, 10)),
        ev("a", "P4", at(2026, 10, 5, 11)),
      ],
      [],
      "me",
    );
    expect(item).toMatchObject({ count: 4, names: ["P4", "P3"], more: 2 });
  });

  it("attaches claps by member and day, and flags the viewer's own", () => {
    const items = activityItems(
      [ev("a", "P1", at(2026, 10, 5)), ev("a", "P2", at(2026, 10, 4))],
      [clap("a", "2026-10-05", "me"), clap("a", "2026-10-05", "b"), clap("a", "2026-10-04", "b"), clap("z", "2026-10-05", "me")],
      "me",
    );
    expect(items[0]).toMatchObject({ claps: ["me", "b"], clappedByMe: true });
    expect(items[1]).toMatchObject({ claps: ["b"], clappedByMe: false });
  });
});

describe("dayLabel / solvedText", () => {
  it("labels today, yesterday and older days", () => {
    expect(dayLabel("2026-10-05", "2026-10-05")).toBe("today");
    expect(dayLabel("2026-10-04", "2026-10-05")).toBe("yesterday");
    expect(dayLabel("2026-10-01", "2026-10-05")).toBe("on Thu, Oct 1");
  });
  it("pluralises the problem count", () => {
    expect(solvedText(1, "today")).toBe("solved 1 problem today");
    expect(solvedText(3, "yesterday")).toBe("solved 3 problems yesterday");
  });
});
