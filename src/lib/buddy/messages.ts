export type MessageKey =
  | "greet.start" | "greet.beatYesterday" | "greet.tied" | "greet.streakRisk" | "greet.chase"
  | "solve.firstToday" | "solve.streakUp" | "solve.tieYesterday" | "solve.beatYesterday"
  | "solve.count5" | "solve.count10" | "solve.count15" | "solve.plain"
  | "focus.end" | "break.end"
  | "nudge.idle"
  | "schedule.behind" | "schedule.ahead" | "schedule.onTrack" | "schedule.restDay";

export type Vars = Record<string, string | number>;

const POOLS: Record<MessageKey, string[]> = {
  "greet.start": [
    "Let's get the first one in today — I'll cheer you on!",
    "Fresh slate. Pick one problem and let's go 🚀",
    "One problem is all it takes to start a streak.",
  ],
  "greet.beatYesterday": [
    "Already {today} today — you beat yesterday's {yesterday} 🔥",
    "{today} solved vs {yesterday} yesterday. You're on fire!",
    "Ahead of yesterday already. Keep the momentum!",
  ],
  "greet.tied": [
    "{today} today, same as yesterday. One more takes the lead!",
    "Tied with yesterday at {today}. Break the tie?",
  ],
  "greet.streakRisk": [
    "Your {streak}-day streak ends tonight unless you solve one 😬",
    "Don't let the {streak}-day streak slip — one quick problem saves it.",
    "Streak at risk! {streak} days on the line.",
  ],
  "greet.chase": [
    "Yesterday {yesterday} · Today {today} — {diff} more to beat it.",
    "{diff} more and you top yesterday's {yesterday}. You got this.",
    "Today {today}, yesterday {yesterday}. Let's close the gap 💪",
  ],
  "solve.firstToday": ["First one of the day! 🎉", "And we're off — problem #1 today.", "Nice start — one down!"],
  "solve.streakUp": ["Streak extended to {streak} days 🔥", "{streak} days in a row. Unstoppable!", "Day {streak} of the streak — locked in."],
  "solve.tieYesterday": ["{today} — tied with yesterday! One more for the win.", "Matched yesterday's {yesterday}. Go beyond?"],
  "solve.beatYesterday": ["{today} today — you just beat yesterday! 🏆", "New lead over yesterday. Legend.", "Yesterday {yesterday}, today {today}. Winning."],
  "solve.count5": ["5 today! High five ✋", "Five problems down. Serious work."],
  "solve.count10": ["10 today?! You're a machine 🤖", "Double digits — 10 solved today."],
  "solve.count15": ["15 today. Stretch break — you earned it.", "15 problems! Hydrate, you beast 💧"],
  "solve.plain": ["Nice one!", "Solved ✔︎ Next!", "Clean. Keep rolling.", "Another one bites the dust."],
  "focus.end": ["Focus session done! Take 5?", "25 minutes well spent. Break time?"],
  "break.end": ["Break's over — ready for another round?", "Recharged? Let's get back to it."],
  "nudge.idle": [
    "Stuck? Re-read the constraints for a hint, or start a 25-min focus.",
    "Been a while… want to try the next one?",
    "Still there? A short focus session can break the block.",
  ],
  "schedule.behind": [
    "Plan says day {planned}, you're on day {working} — {behind} to catch up.",
    "{behind} behind schedule. A couple extra today gets you back.",
  ],
  "schedule.ahead": ["Ahead of plan — day {working} while the plan says {planned} 👏", "Running ahead of schedule. Nice pace!"],
  "schedule.onTrack": ["Right on schedule — day {planned}. Keep it steady.", "On track for day {planned} 🎯"],
  "schedule.restDay": ["Rest day — enjoy it, or sneak one in 😉", "No problems planned today. Rest up!"],
};

export const MESSAGE_KEYS = Object.keys(POOLS) as MessageKey[];
export const poolSize = (key: MessageKey) => POOLS[key].length;

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function fill(text: string, vars: Vars) {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

export interface Picked {
  id: string;
  text: string;
}

/** Random template from the pool, never the same one twice in a row. */
export function pick(
  key: MessageKey,
  vars: Vars = {},
  { rng = Math.random, lastId = null }: { rng?: () => number; lastId?: string | null } = {},
): Picked {
  const pool = POOLS[key];
  let i = Math.min(pool.length - 1, Math.floor(rng() * pool.length));
  if (pool.length > 1 && `${key}#${i}` === lastId) i = (i + 1) % pool.length;
  return { id: `${key}#${i}`, text: fill(pool[i], vars) };
}
