"use client";

import { CalendarArrowUp, ExternalLink, MoreHorizontal, NotebookPen, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Problem } from "@/lib/types";
import { useSprintActions } from "./sprint-context";

export function ProblemActions({ problem }: { problem: Problem }) {
  const a = useSprintActions();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-xs" aria-label="More actions" className="text-muted-foreground">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {problem.url && (
          <DropdownMenuItem asChild>
            <a href={problem.url} target="_blank" rel="noreferrer"><ExternalLink /> Open problem</a>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => a.openNotes(problem)}><NotebookPen /> Notes</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => a.toggleStar(problem)}>
          <Star /> {problem.starred ? "Remove from revisit" : "Mark to revisit"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => a.openMove(problem)}><CalendarArrowUp /> Move to day…</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
