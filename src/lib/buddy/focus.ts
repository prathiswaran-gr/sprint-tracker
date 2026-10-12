export const FOCUS_MS = 25 * 60_000;
export const BREAK_MS = 5 * 60_000;

export type FocusPhase = "focus" | "break";

/** Running when `endsAt` is set, paused when `pausedRemaining` is set. */
export interface FocusState {
  phase: FocusPhase;
  endsAt: number | null;
  pausedRemaining: number | null;
}

export const phaseLength = (phase: FocusPhase) => (phase === "focus" ? FOCUS_MS : BREAK_MS);

export const startPhase = (phase: FocusPhase, now: number): FocusState => ({
  phase,
  endsAt: now + phaseLength(phase),
  pausedRemaining: null,
});

export const pause = (s: FocusState, now: number): FocusState =>
  s.endsAt == null ? s : { ...s, endsAt: null, pausedRemaining: Math.max(0, s.endsAt - now) };

export const resume = (s: FocusState, now: number): FocusState =>
  s.pausedRemaining == null ? s : { ...s, endsAt: now + s.pausedRemaining, pausedRemaining: null };

export const remaining = (s: FocusState, now: number) => s.pausedRemaining ?? Math.max(0, (s.endsAt ?? now) - now);

export const isOver = (s: FocusState, now: number) => s.endsAt != null && now >= s.endsAt;

export function formatClock(ms: number) {
  const sec = Math.ceil(ms / 1000);
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}
