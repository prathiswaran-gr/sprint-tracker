import { differenceInCalendarDays, format, parseISO, subDays } from "date-fns";
import type { Problem } from "@/lib/types";

export const toLocalDate = (isoTs: string) => format(new Date(isoTs), "yyyy-MM-dd");

export function heatmap(doneAts: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const ts of doneAts) {
    const d = toLocalDate(ts);
    m.set(d, (m.get(d) ?? 0) + 1);
  }
  return m;
}

/** Current streak ends today, or yesterday if nothing is done yet today. */
export function streaks(doneAts: string[], today: string) {
  const days = [...new Set(doneAts.map(toLocalDate))].sort();
  if (!days.length) return { current: 0, longest: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    run = differenceInCalendarDays(parseISO(days[i]), parseISO(days[i - 1])) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const set = new Set(days);
  let cursor = parseISO(today);
  if (!set.has(today)) cursor = subDays(cursor, 1);
  let current = 0;
  while (set.has(format(cursor, "yyyy-MM-dd"))) {
    current++;
    cursor = subDays(cursor, 1);
  }
  return { current, longest };
}

export function summary(problems: Problem[], currentDay: number | null) {
  const scheduled = currentDay == null ? [] : problems.filter((p) => p.day_no <= currentDay);
  return {
    total: problems.length,
    done: problems.filter((p) => p.done_at).length,
    starred: problems.filter((p) => p.starred).length,
    scheduledSoFar: scheduled.length,
    overdue: currentDay == null ? 0 : problems.filter((p) => !p.done_at && p.day_no < currentDay).length,
  };
}

export function breakdown(problems: Problem[], keys: (p: Problem) => string[]) {
  const m = new Map<string, { key: string; total: number; done: number }>();
  for (const p of problems) {
    for (const key of keys(p)) {
      const row = m.get(key) ?? { key, total: 0, done: 0 };
      row.total++;
      if (p.done_at) row.done++;
      m.set(key, row);
    }
  }
  return [...m.values()].sort((a, b) => b.total - a.total || a.key.localeCompare(b.key));
}
