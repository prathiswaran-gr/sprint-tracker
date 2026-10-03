import { describe, expect, it } from "vitest";
import { formatDuration } from "./duration";

describe("formatDuration", () => {
  it.each([
    [0, "No schedule"],
    [1, "1 day"],
    [5, "5 days"],
    [14, "14 days · 2 weeks"],
    [136, "136 days · ~19 weeks"],
    [200, "200 days · ~7 months"],
  ])("%i → %s", (days, out) => {
    expect(formatDuration(days)).toBe(out);
  });
});
