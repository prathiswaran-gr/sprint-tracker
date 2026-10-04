"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useMemo } from "react";
import { getGroup, groupProgress, listMyGroups } from "@/lib/api";
import { leaderboard, progressIndex } from "@/lib/groups";

export const useMyGroups = () => useQuery({ queryKey: ["groups"], queryFn: listMyGroups });

/** The group (if any) your sprint is linked to. */
export function useGroupForSprint(sprintId: string) {
  const { data } = useMyGroups();
  return data?.find((g) => g.sprint_id === sprintId) ?? null;
}

/** Roster + who-completed-what for a group, refreshed every minute and on focus. */
export function useGroupProgress(groupId: string | null | undefined) {
  const group = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => getGroup(groupId!),
    enabled: Boolean(groupId),
  });
  const progress = useQuery({
    queryKey: ["group-progress", groupId],
    queryFn: () => groupProgress(groupId!),
    enabled: Boolean(groupId),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  return useMemo(() => {
    const members = group.data?.members ?? [];
    const rows = progress.data ?? [];
    return {
      group: group.data?.group ?? null,
      members,
      index: progressIndex(rows),
      board: leaderboard(members, rows, format(new Date(), "yyyy-MM-dd")),
      isLoading: group.isLoading || progress.isLoading,
      notFound: group.isFetched && group.data === null,
      error: group.error ?? progress.error,
    };
  }, [group.data, group.isLoading, group.isFetched, group.error, progress.data, progress.isLoading, progress.error]);
}
