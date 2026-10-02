export interface Accent {
  id: string;
  label: string;
  hue: number;
  chroma: number;
}

/** Each accent maps to a `[data-accent="id"]` rule in globals.css setting `--h` and `--c`. */
export const ACCENTS = [
  { id: "violet", label: "Violet", hue: 275, chroma: 0.2 },
  { id: "blue", label: "Blue", hue: 255, chroma: 0.19 },
  { id: "teal", label: "Teal", hue: 185, chroma: 0.13 },
  { id: "green", label: "Green", hue: 155, chroma: 0.16 },
  { id: "amber", label: "Amber", hue: 70, chroma: 0.16 },
  { id: "orange", label: "Orange", hue: 45, chroma: 0.19 },
  { id: "rose", label: "Rose", hue: 15, chroma: 0.2 },
  { id: "pink", label: "Pink", hue: 350, chroma: 0.2 },
  { id: "slate", label: "Slate", hue: 260, chroma: 0.03 },
] as const satisfies readonly Accent[];

export type AccentId = (typeof ACCENTS)[number]["id"];
export const DEFAULT_ACCENT: AccentId = "violet";
export const ACCENT_STORAGE_KEY = "accent";

export const isAccent = (v: unknown): v is AccentId => typeof v === "string" && ACCENTS.some((a) => a.id === v);

export const swatch = (a: Accent) => `oklch(0.65 ${a.chroma} ${a.hue})`;

/** Runs in <head> before paint: apply the cached accent to <html>. */
export const accentInitScript = `(function(){try{var a=localStorage.getItem(${JSON.stringify(ACCENT_STORAGE_KEY)});if(${JSON.stringify(
  ACCENTS.map((a) => a.id),
)}.indexOf(a)>-1)document.documentElement.setAttribute("data-accent",a)}catch(e){}})()`;
