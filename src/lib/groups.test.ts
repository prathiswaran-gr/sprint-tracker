import { describe, expect, it } from "vitest";
import { leaderboard, problemKey, progressIndex } from "./groups";
import type { GroupMember, GroupProgressRow } from "./types";

const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12).toISOString();
const member = (user_id: string, display_name: string): GroupMember => ({
  group_id: "g", user_id, sprint_id: `s-${user_id}`, display_name, avatar: null, role: "member", joined_at: at(2026, 9, 1),
});
const members = [member("a", "Prathis"), member("b", "Eswaran"), member("c", "New")];
const rows: GroupProgressRow[] = [
  { user_id: "a", problem_key: "p1", done_at: at(2026, 10, 2) },
  { user_id: "a", problem_key: "p2", done_at: at(2026, 10, 3) },
  { user_id: "a", problem_key: "p3", done_at: at(2026, 10, 4) },
  { user_id: "b", problem_key: "p1", done_at: at(2026, 9, 20) },
  { user_id: "b", problem_key: "p4", done_at: at(2026, 10, 4) },
];

describe("problemKey", () => {
  it("uses the source problem for copies", () => {
    expect(problemKey({ id: "x", source_id: "src" })).toBe("src");
    expect(problemKey({ id: "x", source_id: null })).toBe("x");
  });
});

describe("progressIndex", () => {
  it("maps problem → member → completion date", () => {
    const idx = progressIndex(rows);
    expect([...idx.get("p1")!.keys()]).toEqual(["a", "b"]);
    expect(idx.get("p4")!.get("b")).toBe(at(2026, 10, 4));
    expect(idx.has("p9")).toBe(false);
  });
});

describe("leaderboard", () => {
  it("ranks by problems done with today, streak and last active", () => {
    const board = leaderboard(members, rows, "2026-10-04");
    expect(board.map((r) => r.member.display_name)).toEqual(["Prathis", "Eswaran", "New"]);
    expect(board[0]).toMatchObject({ done: 3, doneToday: 1, streak: 3, lastActive: at(2026, 10, 4) });
    expect(board[1]).toMatchObject({ done: 2, doneToday: 1, streak: 1 });
    expect(board[2]).toMatchObject({ done: 0, doneToday: 0, streak: 0, lastActive: null });
  });
});
