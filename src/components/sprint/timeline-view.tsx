"use client";

import { useDroppable } from "@dnd-kit/core";
import { format, parseISO } from "date-fns";
import { ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { Problem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ProblemCard } from "./problem-card";
import { useSprintActions } from "./sprint-context";

interface DayGroup {
  day: number;
  problems: Problem[];
}
interface SprintGroup {
  sprint: number;
  days: DayGroup[];
  done: number;
  total: number;
}

function group(problems: Problem[]): SprintGroup[] {
  const sprints = new Map<number, Map<number, Problem[]>>();
  for (const p of problems) {
    const days = sprints.get(p.sprint_no) ?? new Map<number, Problem[]>();
    days.set(p.day_no, [...(days.get(p.day_no) ?? []), p]);
    sprints.set(p.sprint_no, days);
  }
  return [...sprints]
    .sort(([a], [b]) => a - b)
    .map(([sprint, days]) => {
      const list = [...days].sort(([a], [b]) => a - b).map(([day, ps]) => ({ day, problems: ps }));
      const all = list.flatMap((d) => d.problems);
      return { sprint, days: list, done: all.filter((p) => p.done_at).length, total: all.length };
    });
}

function DaySection({ day, problems }: DayGroup) {
  const a = useSprintActions();
  const { setNodeRef, isOver } = useDroppable({ id: `day-${day}`, data: { day } });
  const date = a.dateFor(day);
  const done = problems.filter((p) => p.done_at).length;
  const isToday = a.currentDay === day;
  const overdue = a.currentDay != null && day < a.currentDay && done < problems.length;

  return (
    <section
      ref={setNodeRef}
      id={`day-${day}`}
      className={cn("scroll-mt-28 rounded-2xl p-2 transition-colors", isOver && "bg-primary/10 ring-2 ring-primary/40 ring-dashed")}
    >
      <header className="flex items-center gap-2 px-1 pb-2 text-sm">
        <span className={cn("font-semibold", isToday && "text-primary")}>Day {day}</span>
        {date && <span className="text-muted-foreground">{format(parseISO(date), "EEE, MMM d")}</span>}
        {isToday && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground uppercase">Today</span>}
        {overdue && <span className="rounded-full bg-pro/15 px-2 py-0.5 text-[10px] font-semibold text-pro uppercase">Overdue</span>}
        <span className={cn("ml-auto text-xs tabular-nums text-muted-foreground", done === problems.length && "text-basic")}>
          {done}/{problems.length}
        </span>
      </header>
      <div className="flex flex-col gap-1.5">
        {problems.map((p) => (
          <ProblemCard key={p.id} problem={p} />
        ))}
      </div>
    </section>
  );
}

export function TimelineView({ problems, expandAll }: { problems: Problem[]; expandAll: boolean }) {
  const a = useSprintActions();
  const groups = useMemo(() => group(problems), [problems]);

  const defaultOpen = useMemo(() => {
    const current = a.currentDay == null ? undefined : groups.find((g) => g.days.some((d) => d.day >= a.currentDay!));
    const firstUnfinished = groups.find((g) => g.done < g.total);
    return (current ?? firstUnfinished ?? groups[0])?.sprint;
  }, [groups, a.currentDay]);

  // User toggles override the default (current sprint + the sprint holding the focused problem).
  const [overrides, setOverrides] = useState<Map<number, boolean>>(new Map());
  const focusedSprint = problems.find((x) => x.id === a.focusedId)?.sprint_no;
  const isOpenFor = (n: number) => expandAll || (overrides.get(n) ?? (n === defaultOpen || n === focusedSprint));
  const toggle = (n: number) => setOverrides((m) => new Map(m).set(n, !isOpenFor(n)));

  return (
    <div className="flex flex-col gap-3">
      {groups.map((g) => {
        const isOpen = isOpenFor(g.sprint);
        const pct = g.total ? (g.done / g.total) * 100 : 0;
        return (
          <div key={g.sprint} className="overflow-hidden rounded-2xl border bg-card/30">
            <button
              onClick={() => toggle(g.sprint)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
              aria-expanded={isOpen}
            >
              <ChevronRight className={cn("size-4 text-muted-foreground transition-transform", isOpen && "rotate-90")} />
              <span className="font-semibold">Sprint {g.sprint}</span>
              <span className="text-xs text-muted-foreground">
                Day {g.days[0].day}–{g.days.at(-1)!.day}
              </span>
              <span className="ml-auto flex items-center gap-3">
                <span className="hidden h-1.5 w-28 overflow-hidden rounded-full bg-muted sm:block">
                  <span className="block h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${pct}%` }} />
                </span>
                <span className="text-xs tabular-nums text-muted-foreground">{g.done}/{g.total}</span>
              </span>
            </button>
            {isOpen && (
              <div className="grid gap-1 border-t p-2">
                {g.days.map((d) => (
                  <DaySection key={d.day} {...d} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
