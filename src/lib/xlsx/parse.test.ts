import { describe, expect, it } from "vitest";
import { parseWorkbook } from "./parse";
import { buildWorkbook, HEADERS } from "@/test/fixtures/workbook";

describe("parseWorkbook", () => {
  it("lists sheets with headers and data rows", () => {
    const wb = parseWorkbook(buildWorkbook());
    expect(wb.sheets.map((s) => s.name)).toEqual(["DSA Prep Sheet", "Other"]);
    const s = wb.sheets[0];
    expect(s.headers).toEqual(HEADERS);
    expect(s.rows).toHaveLength(5); // fully blank row dropped
    expect(s.rows[0].values[0]).toBe("Linear Search");
    expect(s.rows[0].values[6]).toBe("1");
  });

  it("captures cell hyperlinks", () => {
    const s = parseWorkbook(buildWorkbook()).sheets[0];
    expect(s.rows[1].links[0]).toBe("https://takeuforward.org/practice/dsa/largest-element");
  });

  it("skips leading blank rows to find the header row", () => {
    const s = parseWorkbook(buildWorkbook({ leadingBlankRows: 2 })).sheets[0];
    expect(s.headers[0]).toBe("Name");
    expect(s.rows[0].values[0]).toBe("Linear Search");
  });
});
