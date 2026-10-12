import type { FocusState } from "./focus";

export interface BuddySettings {
  hidden: boolean;
  nudges: boolean;
}

interface Schema {
  settings: BuddySettings;
  lastGreetDate: string | null;
  lastNudgeAt: number | null;
  lastMsgId: string | null;
  focus: FocusState | null;
  focusDone: { date: string; count: number };
  /** sprintId → yyyy-MM-dd of the last schedule check. */
  scheduleSeen: Record<string, string>;
}

const DEFAULTS: Schema = {
  settings: { hidden: false, nudges: true },
  lastGreetDate: null,
  lastNudgeAt: null,
  lastMsgId: null,
  focus: null,
  focusDone: { date: "", count: 0 },
  scheduleSeen: {},
};

const PREFIX = "sprinty:";
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

export function load<K extends keyof Schema>(key: K): Schema[K] {
  const fallback = DEFAULTS[key];
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    const v: unknown = JSON.parse(raw);
    if (isObj(fallback)) return (isObj(v) ? { ...(fallback as object), ...v } : fallback) as Schema[K];
    return v as Schema[K];
  } catch {
    return fallback;
  }
}

export function save<K extends keyof Schema>(key: K, value: Schema[K]) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage unavailable (private mode / quota) — Sprinty just forgets.
  }
}
