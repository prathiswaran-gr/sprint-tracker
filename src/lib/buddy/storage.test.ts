import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { load, save } from "./storage";

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("buddy storage", () => {
  it("returns defaults when nothing is stored", () => {
    expect(load("settings")).toEqual({ hidden: false, nudges: true });
    expect(load("focus")).toBeNull();
    expect(load("scheduleSeen")).toEqual({});
  });

  it("round-trips values under a sprinty: prefix", () => {
    save("lastGreetDate", "2026-10-13");
    expect(localStorage.getItem("sprinty:lastGreetDate")).toBe('"2026-10-13"');
    expect(load("lastGreetDate")).toBe("2026-10-13");
  });

  it("fills missing fields of stored objects from defaults", () => {
    localStorage.setItem("sprinty:settings", JSON.stringify({ hidden: true }));
    expect(load("settings")).toEqual({ hidden: true, nudges: true });
  });

  it("falls back to defaults for corrupt or wrongly-shaped data", () => {
    localStorage.setItem("sprinty:settings", "{not json");
    expect(load("settings")).toEqual({ hidden: false, nudges: true });
    localStorage.setItem("sprinty:settings", '"oops"');
    expect(load("settings")).toEqual({ hidden: false, nudges: true });
  });

  it("swallows storage failures (private mode, quota)", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceeded");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    expect(() => save("lastNudgeAt", 1)).not.toThrow();
    expect(load("lastNudgeAt")).toBeNull();
  });
});
