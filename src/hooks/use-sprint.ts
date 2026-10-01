"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as api from "@/lib/api";
import type { Problem, Sprint } from "@/lib/types";

type SprintData = { sprint: Sprint; problems: Problem[] };
export const sprintKey = (id: string) => ["sprint", id] as const;

export function useSprint(id: string) {
  return useQuery({ queryKey: sprintKey(id), queryFn: () => api.getSprint(id) });
}

/** Optimistically apply `apply` to the cached sprint, run `fn`, roll back + toast on failure. */
function useOptimistic<V>(id: string, fn: (v: V) => Promise<unknown>, apply: (d: SprintData, v: V) => SprintData, label: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onMutate: async (v: V) => {
      await qc.cancelQueries({ queryKey: sprintKey(id) });
      const prev = qc.getQueryData<SprintData>(sprintKey(id));
      if (prev) qc.setQueryData(sprintKey(id), apply(prev, v));
      return { prev };
    },
    onError: (err, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(sprintKey(id), ctx.prev);
      toast.error(`Couldn't ${label}`, { description: err.message });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["sprints"] }),
  });
}

const patchProblems = (d: SprintData, patch: (p: Problem) => Problem): SprintData => ({ ...d, problems: d.problems.map(patch) });

export function useProblemMutations(sprintId: string) {
  const update = useOptimistic(
    sprintId,
    ({ id, patch }: { id: string; patch: api.ProblemPatch }) => api.updateProblem(id, patch),
    (d, { id, patch }) => patchProblems(d, (p) => (p.id === id ? { ...p, ...patch } : p)),
    "save change",
  );

  const reschedule = useOptimistic(
    sprintId,
    (changes: api.DayChange[]) => api.reschedule(changes),
    (d, changes) => {
      const byId = new Map(changes.map((c) => [c.id, c]));
      return patchProblems(d, (p) => (byId.has(p.id) ? { ...p, ...byId.get(p.id)! } : p));
    },
    "reschedule",
  );

  const updateSprint = useOptimistic(
    sprintId,
    (patch: api.SprintPatch) => api.updateSprint(sprintId, patch),
    (d, patch) => ({ ...d, sprint: { ...d.sprint, ...patch } }),
    "update sprint",
  );

  return {
    toggleDone: (p: Problem) =>
      update.mutate({ id: p.id, patch: { done_at: p.done_at ? null : new Date().toISOString() } }),
    toggleStar: (p: Problem) => update.mutate({ id: p.id, patch: { starred: !p.starred } }),
    saveNotes: (p: Problem, notes: string) => update.mutateAsync({ id: p.id, patch: { notes } }),
    reschedule: (changes: api.DayChange[]) => reschedule.mutateAsync(changes),
    updateSprint: (patch: api.SprintPatch) => updateSprint.mutateAsync(patch),
  };
}
