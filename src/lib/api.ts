import { supabaseBrowser } from "@/lib/supabase/client";
import type { Problem, ProblemInput, PublicProblem, PublicSheet, SavedFilter, Sprint } from "@/lib/types";

const db = () => supabaseBrowser();
const PAGE = 1000; // PostgREST default max rows

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

export type ProblemPatch = Partial<Pick<Problem, "done_at" | "starred" | "notes" | "day_no" | "sprint_no">>;
export type SprintPatch = Partial<
  Pick<
    Sprint,
    "title" | "start_date" | "skip_weekends" | "rest_days" | "visibility" | "description" | "show_owner" | "owner_name" | "owner_avatar" | "published_at"
  >
>;
export type DayChange = { id: string; day_no: number; sprint_no: number };

export interface SprintSummary extends Sprint {
  total: number;
  done: number;
}

export async function listSprints(): Promise<SprintSummary[]> {
  const sprints = unwrap(await db().from("sprints").select("*").order("created_at", { ascending: false })) as Sprint[];
  const counts = await Promise.all(
    sprints.map(async (s) => {
      const [total, done] = await Promise.all([
        db().from("problems").select("id", { count: "exact", head: true }).eq("sprint_id", s.id),
        db().from("problems").select("id", { count: "exact", head: true }).eq("sprint_id", s.id).not("done_at", "is", null),
      ]);
      return { total: total.count ?? 0, done: done.count ?? 0 };
    }),
  );
  return sprints.map((s, i) => ({ ...s, ...counts[i] }));
}

export async function getSprint(id: string): Promise<{ sprint: Sprint; problems: Problem[] }> {
  const sprint = unwrap(await db().from("sprints").select("*").eq("id", id).single()) as Sprint;
  const problems: Problem[] = [];
  for (let from = 0; ; from += PAGE) {
    const page = unwrap(
      await db().from("problems").select("*").eq("sprint_id", id).order("position").range(from, from + PAGE - 1),
    ) as Problem[];
    problems.push(...page);
    if (page.length < PAGE) break;
  }
  return { sprint, problems };
}

export async function createSprint(input: { title: string; start_date: string | null; skip_weekends: boolean }, rows: ProblemInput[]) {
  const sprint = unwrap(await db().from("sprints").insert(input).select().single()) as Sprint;
  try {
    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500).map((r) => ({ ...r, sprint_id: sprint.id, original_day_no: r.day_no, original_sprint_no: r.sprint_no }));
      unwrap(await db().from("problems").insert(chunk));
    }
  } catch (e) {
    await db().from("sprints").delete().eq("id", sprint.id);
    throw e;
  }
  return sprint;
}

export async function updateSprint(id: string, patch: SprintPatch) {
  unwrap(await db().from("sprints").update(patch).eq("id", id));
}

export async function deleteSprint(id: string) {
  unwrap(await db().from("sprints").delete().eq("id", id));
}

export async function updateProblem(id: string, patch: ProblemPatch) {
  unwrap(await db().from("problems").update(patch).eq("id", id));
}

export async function reschedule(changes: DayChange[]) {
  if (changes.length) unwrap(await db().rpc("reschedule_problems", { changes }));
}

export async function listSavedFilters(): Promise<SavedFilter[]> {
  return unwrap(await db().from("saved_filters").select("*").order("created_at")) as SavedFilter[];
}

export async function createSavedFilter(name: string, query: Record<string, unknown>) {
  return unwrap(await db().from("saved_filters").insert({ name, query }).select().single()) as SavedFilter;
}

export async function deleteSavedFilter(id: string) {
  unwrap(await db().from("saved_filters").delete().eq("id", id));
}

export async function listPublicSheets(): Promise<PublicSheet[]> {
  return unwrap(await db().from("public_sheets").select("*").order("published_at", { ascending: false }).limit(500)) as PublicSheet[];
}

/** Public catalogue for one sheet, or null if it doesn't exist / isn't public. */
export async function getPublicSheet(id: string): Promise<{ sheet: PublicSheet; problems: PublicProblem[] } | null> {
  const sheet = unwrap(await db().from("public_sheets").select("*").eq("id", id).maybeSingle()) as PublicSheet | null;
  if (!sheet) return null;
  const problems: PublicProblem[] = [];
  for (let from = 0; ; from += PAGE) {
    const page = unwrap(
      await db().from("public_sheet_problems").select("*").eq("sprint_id", id).order("position").range(from, from + PAGE - 1),
    ) as PublicProblem[];
    problems.push(...page);
    if (page.length < PAGE) break;
  }
  return { sheet, problems };
}

/** Copies a public sheet into the caller's account; returns the new sprint id. */
export async function copyPublicSheet(id: string): Promise<string> {
  return unwrap(await db().rpc("copy_public_sheet", { src: id })) as string;
}
