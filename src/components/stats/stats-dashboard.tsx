"use client";

import { format, parseISO, subDays } from "date-fns";
import { ArrowLeft, Flame, Info, Star, Target, TimerReset, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSprint } from "@/hooks/use-sprint";
import { monthWeeks, periodMonths, periodStats, yearOptions, type Period } from "@/lib/calendar";
import { formatSubject } from "@/lib/format";
import { currentPlanDay } from "@/lib/schedule";
import { breakdown, heatmap, streaks, summary, toLocalDate } from "@/lib/stats";
import { cn } from "@/lib/utils";

function Tile({ icon: Icon, label, value, sub }: { icon: typeof Flame; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border bg-card/50 p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="size-3.5" /> {label}</div>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Panel({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border bg-card/40 p-5", className)}>
      <h2 className="mb-4 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function BreakdownBars({ rows, limit = 8 }: { rows: { key: string; total: number; done: number }[]; limit?: number }) {
  const [all, setAll] = useState(false);
  const shown = all ? rows : rows.slice(0, limit);
  return (
    <div className="grid gap-2.5">
      {shown.map((r) => {
        const pct = r.total ? (r.done / r.total) * 100 : 0;
        return (
          <Tooltip key={r.key}>
            <TooltipTrigger asChild>
              <div className="grid grid-cols-[minmax(0,8rem)_1fr_4.5rem] items-center gap-3 text-sm">
                <span className="truncate">{r.key}</span>
                <span className="h-2 overflow-hidden rounded-full bg-muted">
                  <span className="block h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </span>
                <span className="text-right text-xs text-muted-foreground tabular-nums">{r.done}/{r.total}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>{r.key}: {Math.round(pct)}% done</TooltipContent>
          </Tooltip>
        );
      })}
      {rows.length > limit && (
        <button onClick={() => setAll((v) => !v)} className="justify-self-start text-xs text-primary hover:underline">
          {all ? "Show less" : `Show all ${rows.length}`}
        </button>
      )}
    </div>
  );
}

const LEVELS = ["bg-muted", "bg-primary/30", "bg-primary/55", "bg-primary/80", "bg-primary"];

function ActivityStrip({ counts, today, years }: { counts: Map<string, number>; today: string; years: number[] }) {
  const [period, setPeriod] = useState<Period>("current");
  const months = periodMonths(period, today);
  const from = format(new Date(months[0].year, months[0].month, 1), "yyyy-MM-dd");
  const last = months.at(-1)!;
  const to = format(new Date(last.year, last.month + 1, 0), "yyyy-MM-dd");
  const stats = periodStats(counts, from, to);
  const max = Math.max(1, ...counts.values());
  const level = (n: number) => (n === 0 ? 0 : Math.min(4, Math.ceil((n / max) * 4)));

  // Show the latest month first on narrow screens.
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [period]);

  return (
    <section className="rounded-2xl border bg-card/40 p-5">
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <h2 className="flex items-center gap-1.5 text-base">
          <span className="text-xl font-semibold tabular-nums">{stats.total}</span>
          <span className="text-muted-foreground">solved {period === "current" ? "in the past one year" : `in ${period}`}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="size-3.5 text-muted-foreground" aria-label="About this chart" />
            </TooltipTrigger>
            <TooltipContent>Problems marked done, by the day you completed them</TooltipContent>
          </Tooltip>
        </h2>
        <div className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span>Total active days: <span className="font-medium text-foreground tabular-nums">{stats.activeDays}</span></span>
          <span>Max streak: <span className="font-medium text-foreground tabular-nums">{stats.maxStreak}</span></span>
          <Select value={String(period)} onValueChange={(v) => setPeriod(v === "current" ? "current" : Number(v))}>
            <SelectTrigger size="sm" className="w-auto" aria-label="Period"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current</SelectItem>
              {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div ref={scrollRef} className="overflow-x-auto pb-1">
        <div className="flex w-max gap-2.5">
          {months.map(({ year, month }) => (
            <div key={`${year}-${month}`} className="flex flex-col items-center gap-1.5">
              <div className="flex gap-[3px]">
                {monthWeeks(year, month).map((week, w) => (
                  <div key={w} className="flex flex-col gap-[3px]">
                    {week.map((d, i) => {
                      if (!d || d > today) return <span key={i} className="size-[11px]" />;
                      const n = counts.get(d) ?? 0;
                      return (
                        <Tooltip key={d}>
                          <TooltipTrigger asChild>
                            <span className={cn("size-[11px] rounded-[2px]", LEVELS[level(n)], d === today && "ring-1 ring-foreground/60")} />
                          </TooltipTrigger>
                          <TooltipContent>{n} solved · {format(parseISO(d), "EEE, MMM d, yyyy")}</TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">{format(new Date(year, month, 1), "MMM")}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
        Less {LEVELS.map((l) => <span key={l} className={cn("size-[11px] rounded-[2px]", l)} />)} More
      </div>
    </section>
  );
}

const chartConfig = { solved: { label: "Solved", color: "var(--primary)" } } satisfies ChartConfig;

export function StatsDashboard({ id }: { id: string }) {
  const { data, isLoading } = useSprint(id);
  const today = format(new Date(), "yyyy-MM-dd");

  const s = useMemo(() => {
    if (!data) return null;
    const { sprint, problems } = data;
    const cur = currentPlanDay({ startDate: sprint.start_date, skipWeekends: sprint.skip_weekends, restDays: sprint.rest_days }, today);
    const doneAts = problems.flatMap((p) => (p.done_at ? [p.done_at] : []));
    const heat = heatmap(doneAts);
    const daily = Array.from({ length: 30 }, (_, i) => {
      const d = format(subDays(parseISO(today), 29 - i), "yyyy-MM-dd");
      return { date: format(parseISO(d), "MMM d"), solved: heat.get(d) ?? 0 };
    });
    return {
      sprint,
      sum: summary(problems, cur?.day ?? null),
      streak: streaks(doneAts, today),
      heat,
      years: yearOptions(doneAts.map(toLocalDate), sprint.start_date, today),
      daily,
      difficulty: breakdown(problems, (p) => [p.difficulty ?? "Unrated"]),
      subjects: breakdown(problems, (p) => [formatSubject(p.subject || "other")]),
      topics: breakdown(problems, (p) => p.topics),
      companies: breakdown(problems, (p) => p.companies),
    };
  }, [data, today]);

  if (isLoading || !s) {
    return (
      <div className="mx-auto grid max-w-5xl gap-4 p-4 sm:p-8">
        <Skeleton className="h-8 w-60" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  const pct = s.sum.total ? Math.round((s.sum.done / s.sum.total) * 100) : 0;
  const pace = s.sum.scheduledSoFar ? s.sum.done - s.sum.scheduledSoFar : null;

  return (
    <div className="mx-auto grid max-w-5xl gap-5 p-4 sm:p-8">
      <div>
        <Link href={`/app/s/${id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> {s.sprint.title}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Progress</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile icon={Target} label="Completed" value={`${pct}%`} sub={`${s.sum.done} of ${s.sum.total} problems`} />
        <Tile icon={Flame} label="Current streak" value={`${s.streak.current}d`} sub={`Longest: ${s.streak.longest} days`} />
        <Tile
          icon={TimerReset}
          label="Pace"
          value={pace == null ? "—" : pace >= 0 ? `+${pace}` : `${pace}`}
          sub={pace == null ? "Set a start date" : pace >= 0 ? "ahead of schedule" : `${s.sum.overdue} overdue`}
        />
        <Tile icon={Star} label="To revisit" value={String(s.sum.starred)} sub="starred problems" />
      </div>

      <ActivityStrip counts={s.heat} today={today} years={s.years} />

      <Panel title="Solved per day — last 30 days">
        <ChartContainer config={chartConfig} className="h-48 w-full">
          <BarChart data={s.daily} margin={{ left: -20, right: 4 }}>
            <CartesianGrid vertical={false} strokeOpacity={0.4} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} interval={6} fontSize={11} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} width={40} />
            <ChartTooltip cursor={{ fillOpacity: 0.08 }} content={<ChartTooltipContent />} />
            <Bar dataKey="solved" fill="var(--color-solved)" radius={[4, 4, 0, 0]} maxBarSize={18} />
          </BarChart>
        </ChartContainer>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="By difficulty"><BreakdownBars rows={s.difficulty} /></Panel>
        {s.subjects.length > 1 && <Panel title="By subject"><BreakdownBars rows={s.subjects} /></Panel>}
        <Panel title="Top topics"><BreakdownBars rows={s.topics} /></Panel>
        <Panel title="Top companies" className={s.subjects.length > 1 ? "lg:col-span-2" : undefined}>
          <BreakdownBars rows={s.companies} limit={10} />
        </Panel>
      </div>

      {s.sum.done === 0 && (
        <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Trophy className="size-4" /> Complete your first problem to start the streak.
        </p>
      )}
    </div>
  );
}
