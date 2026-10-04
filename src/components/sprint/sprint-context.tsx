"use client";

import { createContext, useContext } from "react";
import type { Filters } from "@/lib/filters";
import type { Peer } from "@/components/groups/member-avatar";
import type { Problem } from "@/lib/types";

export interface SprintActions {
  toggleDone: (p: Problem) => void;
  toggleStar: (p: Problem) => void;
  openNotes: (p: Problem) => void;
  openMove: (p: Problem) => void;
  moveToDay: (p: Problem, day: number) => void;
  focus: (p: Problem) => void;
  focusedId: string | null;
  filters: Filters;
  dateFor: (day: number) => string | null;
  currentDay: number | null;
  /** Group members (excluding you) who completed this problem; empty when not in a group. */
  peersFor: (p: Problem) => Peer[];
}

const Ctx = createContext<SprintActions | null>(null);
export const SprintActionsProvider = Ctx.Provider;
export function useSprintActions() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSprintActions outside provider");
  return v;
}
