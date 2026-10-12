"use client";

import { useQuery } from "@tanstack/react-query";
import { format, startOfDay, subDays } from "date-fns";
import { useMemo } from "react";
import * as api from "@/lib/api";
import { dayStats } from "@/lib/buddy/triggers";

export const buddyDoneKey = ["buddy", "done"] as const;
const WINDOW_DAYS = 60;

/** The user's recent solves across all sprints, reduced to today / yesterday / streak. */
export function useBuddyStats() {
  const q = useQuery({
    queryKey: buddyDoneKey,
    queryFn: () => api.listMyDoneTimestamps(subDays(startOfDay(new Date()), WINDOW_DAYS).toISOString()),
  });
  const today = format(new Date(), "yyyy-MM-dd");
  const stats = useMemo(() => (q.data ? dayStats(q.data, today) : null), [q.data, today]);
  return { stats };
}
