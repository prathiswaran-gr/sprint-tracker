import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ACCENTS, DEFAULT_ACCENT, accentInitScript, isAccent, swatch } from "./accents";

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

describe("accents", () => {
  it("includes pink and a valid default", () => {
    expect(ACCENTS.map((a) => a.id)).toContain("pink");
    expect(isAccent(DEFAULT_ACCENT)).toBe(true);
  });

  it("validates ids", () => {
    expect(isAccent("pink")).toBe(true);
    expect(isAccent("hotdog")).toBe(false);
    expect(isAccent(undefined)).toBe(false);
  });

  it("has a CSS rule with matching hue/chroma for every accent", () => {
    for (const a of ACCENTS) {
      const rule = css.match(new RegExp(`\\[data-accent="${a.id}"\\]\\s*{([^}]*)}`));
      expect(rule, a.id).not.toBeNull();
      expect(rule![1]).toContain(`--h: ${a.hue};`);
      expect(rule![1]).toContain(`--c: ${a.chroma};`);
    }
  });

  it("derives swatch colours from hue and chroma", () => {
    expect(swatch({ id: "pink", label: "Pink", hue: 350, chroma: 0.2 })).toBe("oklch(0.65 0.2 350)");
  });

  it("init script only applies known accents", () => {
    const html = document.documentElement;
    html.setAttribute("data-accent", DEFAULT_ACCENT);
    localStorage.setItem("accent", "pink");
    new Function(accentInitScript)();
    expect(html.getAttribute("data-accent")).toBe("pink");
    localStorage.setItem("accent", "<script>");
    new Function(accentInitScript)();
    expect(html.getAttribute("data-accent")).toBe("pink");
  });
});
