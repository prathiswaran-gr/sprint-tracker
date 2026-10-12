import { format, parseISO, subDays } from "date-fns";
import { currentPlanDay, workingDay, type ScheduleConfig } from "@/lib/schedule";
import { heatmap, streaks } from "@/lib/stats";
import type { MessageKey } from "./messages";

export interface DayStats {
  today: number;
  yesterday: number;
  streak: number;
  total: number;
}

export function dayStats(doneAts: string[], today: string): DayStats {
  const days = heatmap(doneAts);
  const yesterday = format(subDays(parseISO(today), 1), "yyyy-MM-dd");
  return {
    today: days.get(today) ?? 0,
    yesterday: days.get(yesterday) ?? 0,
    streak: streaks(doneAts, today).current,
    total: doneAts.length,
  };
}

export function salutation(hour: number) {
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 22) return "Good evening";
  return "Hey night owl";
}

export const STREAK_RISK_HOUR = 18;

export type GreetKey = Extract<MessageKey, `greet.${string}`>;

export function greetingSituation(s: DayStats, hour: number): GreetKey {
  if (s.total === 0) return "greet.start";
  if (s.today > 0 && s.today > s.yesterday) return "greet.beatYesterday";
  if (s.today > 0 && s.today === s.yesterday) return "greet.tied";
  if (s.today === 0 && s.streak > 0 && hour >= STREAK_RISK_HOUR) return "greet.streakRisk";
  return "greet.chase";
}

export type SolveKey = Extract<MessageKey, `solve.${string}`>;

/** Which celebration a new solve earns. `before` = stats just before this solve. */
export function milestone(before: DayStats): SolveKey {
  const now = before.today + 1;
  if (now === 1) return before.streak > 0 ? "solve.streakUp" : "solve.firstToday";
  if (before.yesterday > 0 && now === before.yesterday) return "solve.tieYesterday";
  if (before.yesterday > 0 && now === before.yesterday + 1) return "solve.beatYesterday";
  if (now === 5) return "solve.count5";
  if (now === 10) return "solve.count10";
  if (now === 15) return "solve.count15";
  return "solve.plain";
}

export type ScheduleStatus =
  | { kind: "behind"; planned: number; working: number; behind: number }
  | { kind: "ahead" | "onTrack"; planned: number; working: number }
  | { kind: "restDay" };

/** How the user stands against the sprint's calendar today, or null when there's nothing useful to say. */
export function scheduleStatus(
  cfg: ScheduleConfig,
  problems: { day_no: number; done_at: string | null }[],
  today: string,
): ScheduleStatus | null {
  if (!cfg.startDate || cfg.startDate > today || !problems.length) return null;
  if (problems.every((p) => p.done_at)) return null;
  const cur = currentPlanDay(cfg, today)!;
  if (!cur.isWorkingDay) return { kind: "restDay" };
  const working = workingDay(problems, cur.day)!;
  const behind = problems.filter((p) => !p.done_at && p.day_no < cur.day).length;
  if (behind > 0 && working < cur.day) return { kind: "behind", planned: cur.day, working, behind };
  if (working > cur.day) return { kind: "ahead", planned: cur.day, working };
  return { kind: "onTrack", planned: cur.day, working };
}

export const IDLE_MS = 20 * 60_000;
export const ACTIVE_MS = 2 * 60_000;
export const NUDGE_GAP_MS = 30 * 60_000;

/** Idle long enough without a solve, but still at the keyboard, and not nudged recently. */
export function shouldIdleNudge(t: { now: number; lastActivity: number; idleSince: number; lastNudgeAt: number | null }) {
  return (
    t.now - t.idleSince >= IDLE_MS &&
    t.now - t.lastActivity <= ACTIVE_MS &&
    (t.lastNudgeAt == null || t.now - t.lastNudgeAt >= NUDGE_GAP_MS)
  );
}
