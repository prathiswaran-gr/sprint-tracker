import type { FocusPhase } from "./focus";
import { pick, plural, type Vars } from "./messages";
import { greetingSituation, milestone, salutation, type DayStats, type GreetKey, type ScheduleStatus } from "./triggers";

export type Mood = "idle" | "happy" | "cheer" | "sleepy" | "focused" | "concerned";
export type BubbleKind = "celebrate" | "focusEnd" | "schedule" | "greeting" | "nudge";
export type ActionId = "startFocus" | "startBreak" | "dismiss";

export interface BubbleAction {
  id: ActionId;
  label: string;
}

export interface Bubble {
  kind: BubbleKind;
  id: string;
  text: string;
  mood: Mood;
  actions: BubbleAction[];
  confetti: boolean;
}

export interface PickOpts {
  rng?: () => number;
  lastId?: string | null;
}

const PRIORITY: Record<BubbleKind, number> = { celebrate: 5, focusEnd: 4, schedule: 3, greeting: 2, nudge: 1 };
export const MAX_QUEUE = 3;

const GREET_MOOD: Record<GreetKey, Mood> = {
  "greet.start": "happy",
  "greet.beatYesterday": "cheer",
  "greet.tied": "happy",
  "greet.streakRisk": "concerned",
  "greet.chase": "happy",
};

const SCHEDULE_MOOD: Record<ScheduleStatus["kind"], Mood> = { behind: "concerned", ahead: "cheer", onTrack: "happy", restDay: "sleepy" };

const focusAction: BubbleAction = { id: "startFocus", label: "Start focus" };

function firstName(name: string) {
  const n = name.trim();
  return (n.includes("@") ? n.split("@")[0] : n.split(/\s+/)[0]) || "there";
}

export function greetingBubble(s: DayStats, name: string, hour: number, opts: PickOpts = {}): Bubble {
  const key = greetingSituation(s, hour);
  const diff = Math.max(1, s.yesterday - s.today + 1);
  const p = pick(key, { today: s.today, yesterday: s.yesterday, streak: s.streak, diff }, opts);
  return {
    kind: "greeting",
    id: p.id,
    text: `${salutation(hour)}, ${firstName(name)}! ${p.text}`,
    mood: GREET_MOOD[key],
    actions: [focusAction, { id: "dismiss", label: "Later" }],
    confetti: false,
  };
}

/** `before` = stats just before this solve. Milestones get confetti; plain solves don't. */
export function celebrateBubble(before: DayStats, opts: PickOpts = {}): Bubble {
  const key = milestone(before);
  const streak = before.today === 0 ? before.streak + 1 : before.streak;
  const p = pick(key, { today: before.today + 1, yesterday: before.yesterday, streak }, opts);
  return { kind: "celebrate", id: p.id, text: p.text, mood: "cheer", actions: [], confetti: key !== "solve.plain" };
}

export function scheduleBubble(st: ScheduleStatus, opts: PickOpts = {}): Bubble {
  const vars: Vars =
    st.kind === "restDay"
      ? {}
      : { planned: st.planned, working: st.working, behind: st.kind === "behind" ? plural(st.behind, "problem") : "" };
  const p = pick(`schedule.${st.kind}` as const, vars, opts);
  return {
    kind: "schedule",
    id: p.id,
    text: p.text,
    mood: SCHEDULE_MOOD[st.kind],
    actions: st.kind === "behind" ? [focusAction] : [],
    confetti: false,
  };
}

export function nudgeBubble(opts: PickOpts = {}): Bubble {
  const p = pick("nudge.idle", {}, opts);
  return { kind: "nudge", id: p.id, text: p.text, mood: "sleepy", actions: [focusAction, { id: "dismiss", label: "Not now" }], confetti: false };
}

export function focusEndBubble(phase: FocusPhase, opts: PickOpts = {}): Bubble {
  if (phase === "focus") {
    const p = pick("focus.end", {}, opts);
    return {
      kind: "focusEnd",
      id: p.id,
      text: p.text,
      mood: "cheer",
      actions: [{ id: "startBreak", label: "Break 5 min" }, { id: "startFocus", label: "Another round" }],
      confetti: true,
    };
  }
  const p = pick("break.end", {}, opts);
  return { kind: "focusEnd", id: p.id, text: p.text, mood: "happy", actions: [focusAction], confetti: false };
}

/** One bubble per kind, highest priority first, capped. A greeting and a schedule check merge into one bubble. */
export function enqueue(queue: Bubble[], b: Bubble): Bubble[] {
  let next = b;
  let rest = queue;
  const mateKind = b.kind === "greeting" ? "schedule" : b.kind === "schedule" ? "greeting" : null;
  const mate = mateKind && queue.find((q) => q.kind === mateKind);
  if (mate) {
    const [greet, sched] = b.kind === "greeting" ? [b, mate] : [mate, b];
    // Keep the already-queued bubble's id so an on-screen bubble updates in place instead of re-animating.
    next = {
      ...greet,
      id: mate.id,
      kind: "schedule",
      text: `${greet.text}\n${sched.text}`,
      mood: sched.mood === "concerned" ? "concerned" : greet.mood,
    };
    rest = queue.filter((q) => q !== mate);
  }
  return [...rest.filter((q) => q.kind !== next.kind), next]
    .sort((x, y) => PRIORITY[y.kind] - PRIORITY[x.kind])
    .slice(0, MAX_QUEUE);
}
