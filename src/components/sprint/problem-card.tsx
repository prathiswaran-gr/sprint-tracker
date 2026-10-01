"use client";

import { useDraggable } from "@dnd-kit/core";
import { GripVertical, NotebookPen, Star } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { Problem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CompanyTags, DifficultyChip, SubjectTag, Tag } from "./chips";
import { ProblemActions } from "./problem-actions";
import { useSprintActions } from "./sprint-context";

export function ProblemName({ problem }: { problem: Problem }) {
  const cls = cn("truncate font-medium", problem.done_at && "text-muted-foreground line-through decoration-muted-foreground/50");
  return problem.url ? (
    <a href={problem.url} target="_blank" rel="noreferrer" className={cn(cls, "hover:text-primary hover:underline underline-offset-2")}>
      {problem.name}
    </a>
  ) : (
    <span className={cls}>{problem.name}</span>
  );
}

export function StarButton({ problem }: { problem: Problem }) {
  const a = useSprintActions();
  return (
    <button
      onClick={() => a.toggleStar(problem)}
      aria-label={problem.starred ? "Unstar" : "Star to revisit"}
      aria-pressed={problem.starred}
      className={cn(
        "rounded-md p-1 transition-colors hover:bg-muted",
        problem.starred ? "text-core" : "text-muted-foreground/50 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-md:opacity-100",
      )}
    >
      <Star className="size-3.5" fill={problem.starred ? "currentColor" : "none"} />
    </button>
  );
}

export function NotesButton({ problem }: { problem: Problem }) {
  const a = useSprintActions();
  const has = problem.notes.trim().length > 0;
  return (
    <button
      onClick={() => a.openNotes(problem)}
      aria-label="Notes"
      className={cn(
        "rounded-md p-1 transition-colors hover:bg-muted",
        has ? "text-primary" : "text-muted-foreground/50 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-md:opacity-100",
      )}
    >
      <NotebookPen className="size-3.5" />
    </button>
  );
}

export function ProblemCard({ problem, draggable = true }: { problem: Problem; draggable?: boolean }) {
  const a = useSprintActions();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: problem.id, data: { problem }, disabled: !draggable });
  const focused = a.focusedId === problem.id;

  return (
    <div
      ref={setNodeRef}
      data-problem-id={problem.id}
      onClick={() => a.focus(problem)}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-xl border bg-card/60 px-2.5 py-2 transition-colors hover:border-foreground/15 hover:bg-card",
        problem.done_at && "bg-card/30",
        focused && "ring-2 ring-primary/60",
        isDragging && "opacity-40",
      )}
    >
      {draggable && (
        <button
          {...listeners}
          {...attributes}
          aria-label="Drag to another day"
          className="-ml-1 hidden cursor-grab touch-none rounded p-0.5 text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing md:block"
        >
          <GripVertical className="size-3.5" />
        </button>
      )}
      <Checkbox
        checked={Boolean(problem.done_at)}
        onCheckedChange={() => a.toggleDone(problem)}
        aria-label={`Mark ${problem.name} ${problem.done_at ? "not done" : "done"}`}
        className="size-4.5 rounded-full data-[state=checked]:border-basic data-[state=checked]:bg-basic"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-2.5">
        <ProblemName problem={problem} />
        <div className="flex min-w-0 items-center gap-1.5">
          <DifficultyChip difficulty={problem.difficulty} />
          <SubjectTag subject={problem.subject} />
          {problem.topics.slice(0, 2).map((t) => (
            <Tag key={t} className="max-sm:hidden" active={a.filters.topics.includes(t)}>{t}</Tag>
          ))}
          <span className="hidden min-w-0 lg:flex">
            <CompanyTags companies={problem.companies} highlight={a.filters.companies} max={2} />
          </span>
        </div>
      </div>
      <div className="flex items-center">
        <StarButton problem={problem} />
        <NotesButton problem={problem} />
        <ProblemActions problem={problem} />
      </div>
    </div>
  );
}
