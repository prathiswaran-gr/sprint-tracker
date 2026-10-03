import { describe, expect, it } from "vitest";
import { formatSubject } from "./format";

describe("formatSubject", () => {
  it.each([
    ["dsa", "DSA"],
    ["dbms", "DBMS"],
    ["lld", "LLD"],
    ["oops", "OOPs"],
    ["computer-networks", "Computer Networks"],
    ["operating-system", "Operating System"],
    ["system_design", "System Design"],
    ["", ""],
  ])("%s → %s", (raw, out) => expect(formatSubject(raw)).toBe(out));
});
