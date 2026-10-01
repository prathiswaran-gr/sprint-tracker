import { describe, expect, it } from "vitest";
import { parseWorkbook } from "./parse";
import { detectMapping, toProblems } from "./mapColumns";
import { buildWorkbook } from "@/test/fixtures/workbook";

const sheet = () => parseWorkbook(buildWorkbook()).sheets[0];

describe("detectMapping", () => {
  it("maps reference headers", () => {
    expect(detectMapping(sheet().headers)).toEqual({
      name: 0, url: 1, subject: 2, difficulty: 3, companies: 4, topics: 5, sprint: 6, day: 7,
    });
  });

  it("matches aliases case/space-insensitively", () => {
    expect(detectMapping([" Problem Name ", "LINK", "Company Tags", "Tags", "Level", "Week", "Day No"])).toEqual({
      name: 0, url: 1, companies: 2, topics: 3, difficulty: 4, sprint: 5, day: 6,
    });
  });
});

describe("toProblems", () => {
  it("normalizes rows", () => {
    const s = sheet();
    const { problems, warnings } = toProblems(s, detectMapping(s.headers));
    expect(problems).toHaveLength(5);
    expect(problems[0]).toEqual({
      position: 0, name: "Linear Search", url: "https://takeuforward.org/practice/dsa/linear-search",
      subject: "dsa", difficulty: "Basic", companies: ["Accenture", "Adobe", "Zoho"], topics: ["Arrays"],
      sprint_no: 1, day_no: 1,
    });
    expect(problems[1].url).toBe("https://takeuforward.org/practice/dsa/largest-element");
    expect(problems[1].companies).toEqual(["Adobe", "Google", "Zoho"]);
    expect(problems[2]).toMatchObject({ difficulty: null, companies: [], topics: [], subject: "oops" });
    expect(problems[3]).toMatchObject({ subject: "dsa", difficulty: "Core", companies: ["Google", "Amazon"] });
    expect(problems[4]).toMatchObject({ sprint_no: 20, day_no: 136, position: 4 });
    expect(warnings).toEqual([]);
  });

  it("defaults missing sprint/day and warns", () => {
    const s = sheet();
    const { problems, warnings } = toProblems(s, { name: 0 });
    expect(problems[0]).toMatchObject({ sprint_no: 1, day_no: 1, url: "", subject: "", companies: [] });
    expect(warnings.some((w) => /day/i.test(w))).toBe(true);
  });

  it("throws without a name column", () => {
    expect(() => toProblems(sheet(), { url: 1 })).toThrow(/name/i);
  });
});
