import { addDays, format, parseISO } from "date-fns";
import { toLocalDate } from "@/lib/stats";
import type { GroupActivityRow, GroupReaction } from "@/lib/types";

export interface ActivityItem {
  /** `${user_id}:${day}`, also the reaction target. */
  key: string;
  user_id: string;
  day: string; // yyyy-MM-dd, local
  count: number;
  /** The two most recent problem names. */
  names: string[];
  more: number;
  /** User ids who clapped. */
  claps: string[];
  clappedByMe: boolean;
}

const SHOWN_NAMES = 2;

/** One item per member per local day, newest day first. Claps attach to that member-day. */
export function activityItems(events: GroupActivityRow[], reactions: GroupReaction[], me: string): ActivityItem[] {
  const groups = new Map<string, { user_id: string; day: string; rows: GroupActivityRow[] }>();
  for (const e of events) {
    const day = toLocalDate(e.done_at);
    const key = `${e.user_id}:${day}`;
    const g = groups.get(key) ?? { user_id: e.user_id, day, rows: [] };
    g.rows.push(e);
    groups.set(key, g);
  }

  const latest = (rows: GroupActivityRow[]) => rows.reduce((a, r) => (r.done_at > a ? r.done_at : a), "");
  return [...groups.entries()]
    .sort(([, a], [, b]) => b.day.localeCompare(a.day) || latest(b.rows).localeCompare(latest(a.rows)))
    .map(([key, g]) => {
      const newestFirst = [...g.rows].sort((a, b) => b.done_at.localeCompare(a.done_at));
      const claps = reactions.filter((r) => r.target_user === g.user_id && r.day === g.day).map((r) => r.reactor);
      return {
        key,
        user_id: g.user_id,
        day: g.day,
        count: g.rows.length,
        names: newestFirst.slice(0, SHOWN_NAMES).map((r) => r.problem_name),
        more: Math.max(0, g.rows.length - SHOWN_NAMES),
        claps,
        clappedByMe: claps.includes(me),
      };
    });
}

export function dayLabel(day: string, today: string): string {
  if (day === today) return "today";
  if (day === format(addDays(parseISO(today), -1), "yyyy-MM-dd")) return "yesterday";
  return `on ${format(parseISO(day), "EEE, MMM d")}`;
}

export const solvedText = (count: number, label: string) => `solved ${count} problem${count === 1 ? "" : "s"} ${label}`;
