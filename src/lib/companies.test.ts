import { describe, expect, it } from "vitest";
import { MAANG, summarizeCompanies } from "./companies";

describe("summarizeCompanies", () => {
  const counts = { Google: 40, Amazon: 35, Meta: 20, Zoho: 50, Adobe: 30, Uber: 5, Microsoft: 25 };

  it("reports MAANG coverage in fixed order", () => {
    const s = summarizeCompanies(counts);
    expect(s.maang.map((m) => m.name)).toEqual([...MAANG]);
    expect(s.maang.find((m) => m.name === "Google")).toEqual({ name: "Google", covered: true, count: 40 });
    expect(s.maang.find((m) => m.name === "Netflix")).toEqual({ name: "Netflix", covered: false, count: 0 });
    expect(s.maangCovered).toBe(3);
    expect(s.total).toBe(7);
  });

  it("lists other companies by frequency", () => {
    expect(summarizeCompanies(counts, 3).others).toEqual([
      { name: "Zoho", count: 50 },
      { name: "Adobe", count: 30 },
      { name: "Microsoft", count: 25 },
    ]);
  });

  it("handles empty input", () => {
    expect(summarizeCompanies({})).toMatchObject({ maangCovered: 0, others: [], total: 0 });
  });
});
