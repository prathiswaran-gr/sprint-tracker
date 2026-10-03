import { addDays, differenceInCalendarDays, format, getDay, getDaysInMonth, parseISO } from "date-fns";

/** A month as week columns, each 7 slots Sun→Sat holding yyyy-MM-dd, or null outside the month. */
export function monthWeeks(year: number, monthIndex: number): (string | null)[][] {
  const first = new Date(year, monthIndex, 1);
  const slots: (string | null)[] = Array.from({ length: getDay(first) }, () => null);
  for (let d = 0; d < getDaysInMonth(first); d++) slots.push(format(addDays(first, d), "yyyy-MM-dd"));
  while (slots.length % 7) slots.push(null);
  return Array.from({ length: slots.length / 7 }, (_, w) => slots.slice(w * 7, w * 7 + 7));
}

export type Period = "current" | number;

/** The 12 months shown for a period: rolling (ending this month) or Jan–Dec of a year. */
export function periodMonths(period: Period, today: string): { year: number; month: number }[] {
  if (period !== "current") return Array.from({ length: 12 }, (_, month) => ({ year: period, month }));
  const t = parseISO(today);
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(t.getFullYear(), t.getMonth() - 11 + i, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
}

/** Totals within [from, to] (yyyy-MM-dd, inclusive): problems solved, active days, longest run of active days. */
export function periodStats(counts: Map<string, number>, from: string, to: string) {
  const days = [...counts].filter(([d, n]) => n > 0 && d >= from && d <= to).map(([d]) => d).sort();
  let maxStreak = 0;
  let run = 0;
  days.forEach((d, i) => {
    run = i > 0 && differenceInCalendarDays(parseISO(d), parseISO(days[i - 1])) === 1 ? run + 1 : 1;
    maxStreak = Math.max(maxStreak, run);
  });
  return { total: days.reduce((s, d) => s + counts.get(d)!, 0), activeDays: days.length, maxStreak };
}

/** Years worth offering in the picker, newest first. */
export function yearOptions(doneDates: string[], startDate: string | null, today: string): number[] {
  const years = new Set<number>([Number(today.slice(0, 4))]);
  for (const d of doneDates) years.add(Number(d.slice(0, 4)));
  if (startDate) years.add(Number(startDate.slice(0, 4)));
  return [...years].sort((a, b) => b - a);
}
