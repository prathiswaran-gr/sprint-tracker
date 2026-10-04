"use client";

import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { format, parseISO } from "date-fns";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import type { Filters } from "@/lib/filters";
import type { Problem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CompanyTags, DifficultyChip, SubjectTag, Tag } from "./chips";
import { PeersBadge } from "@/components/groups/member-avatar";
import { ProblemActions } from "./problem-actions";
import { NotesButton, ProblemName, StarButton } from "./problem-card";
import { useSprintActions } from "./sprint-context";

const GRID = "grid grid-cols-[2rem_minmax(0,1fr)_5rem_4.5rem] md:grid-cols-[2rem_minmax(12rem,2fr)_5rem_minmax(8rem,1fr)_minmax(10rem,1.3fr)_5.5rem_5.5rem] items-center gap-3";

function SortHeader({ label, sort, filters, onSort, className }: {
  label: string; sort: Filters["sort"]; filters: Filters; onSort: (s: Filters["sort"]) => void; className?: string;
}) {
  const active = filters.sort === sort;
  const Icon = filters.dir === "desc" ? ArrowDown : ArrowUp;
  return (
    <button onClick={() => onSort(sort)} className={cn("flex items-center gap-1 text-left hover:text-foreground", active && "text-foreground", className)}>
      {label}
      {active && <Icon className="size-3" />}
    </button>
  );
}

export function TableView({ problems, onSort }: { problems: Problem[]; onSort: (s: Filters["sort"]) => void }) {
  const a = useSprintActions();
  const listRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  useEffect(() => setOffset(listRef.current?.offsetTop ?? 0), []);

  const v = useWindowVirtualizer({ count: problems.length, estimateSize: () => 44, overscan: 12, scrollMargin: offset });

  // Keep keyboard-focused row in view.
  useEffect(() => {
    const i = problems.findIndex((p) => p.id === a.focusedId);
    if (i >= 0) v.scrollToIndex(i, { align: "auto" });
  }, [a.focusedId, problems, v]);

  return (
    <div className="overflow-hidden rounded-2xl border bg-card/30">
      <div className={cn(GRID, "sticky top-0 z-10 border-b bg-background/90 px-3 py-2 text-xs font-medium text-muted-foreground backdrop-blur")}>
        <span />
        <SortHeader label="Problem" sort="name" filters={a.filters} onSort={onSort} />
        <SortHeader label="Level" sort="difficulty" filters={a.filters} onSort={onSort} />
        <span className="hidden md:block">Topics</span>
        <SortHeader label="Companies" sort="companies" filters={a.filters} onSort={onSort} className="hidden md:flex" />
        <SortHeader label="Day" sort="day" filters={a.filters} onSort={onSort} className="max-md:justify-end" />
        <SortHeader label="Done" sort="done" filters={a.filters} onSort={onSort} className="hidden md:flex" />
      </div>
      <div ref={listRef} style={{ height: v.getTotalSize(), position: "relative" }}>
        {v.getVirtualItems().map((row) => {
          const p = problems[row.index];
          const date = a.dateFor(p.day_no);
          return (
            <div
              key={p.id}
              data-problem-id={p.id}
              onClick={() => a.focus(p)}
              className={cn(
                GRID,
                "group absolute inset-x-0 border-b border-border/50 px-3 text-sm transition-colors hover:bg-muted/40",
                a.focusedId === p.id && "bg-primary/10",
              )}
              style={{ height: row.size, transform: `translateY(${row.start - v.options.scrollMargin}px)` }}
            >
              <Checkbox
                checked={Boolean(p.done_at)}
                onCheckedChange={() => a.toggleDone(p)}
                aria-label={`Mark ${p.name} ${p.done_at ? "not done" : "done"}`}
                className="size-4.5 rounded-full"
              />
              <span className="flex min-w-0 items-center gap-1.5">
                <ProblemName problem={p} />
                <SubjectTag subject={p.subject} />
                <span className="ml-auto flex shrink-0 items-center gap-0.5">
                  <PeersBadge peers={a.peersFor(p)} />
                  <StarButton problem={p} />
                  <NotesButton problem={p} />
                  <ProblemActions problem={p} />
                </span>
              </span>
              <span><DifficultyChip difficulty={p.difficulty} /></span>
              <span className="hidden min-w-0 gap-1 overflow-hidden md:flex">
                {p.topics.slice(0, 2).map((t) => <Tag key={t} active={a.filters.topics.includes(t)}>{t}</Tag>)}
              </span>
              <span className="hidden min-w-0 overflow-hidden md:block">
                <CompanyTags companies={p.companies} highlight={a.filters.companies} max={2} />
              </span>
              <span className="text-xs tabular-nums text-muted-foreground max-md:text-right">
                <span className={cn(a.currentDay === p.day_no && "font-semibold text-primary")}>D{p.day_no}</span>
                {date && <span className="hidden md:inline"> · {format(parseISO(date), "MMM d")}</span>}
              </span>
              <span className="hidden text-xs text-muted-foreground tabular-nums md:block">
                {p.done_at ? format(new Date(p.done_at), "MMM d") : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
