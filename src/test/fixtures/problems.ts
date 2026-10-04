import type { Problem, Sprint } from "@/lib/types";

let n = 0;
export function mkProblem(p: Partial<Problem> = {}): Problem {
  n++;
  return {
    id: `p${n}`, sprint_id: "s1", position: n, name: `Problem ${n}`, url: "", subject: "dsa",
    difficulty: "Core", companies: [], topics: [], sprint_no: 1, day_no: 1, original_day_no: p.day_no ?? 1, original_sprint_no: null, source_id: null,
    done_at: null, starred: false, notes: "", ...p,
  };
}

export function mkSprint(s: Partial<Sprint> = {}): Sprint {
  return {
    id: "s1", user_id: "u", title: "DSA Prep", start_date: null, skip_weekends: false, rest_days: [],
    visibility: "private", description: "", show_owner: true, owner_name: null, owner_avatar: null,
    published_at: null, copied_from: null, copy_count: 0, created_at: new Date().toISOString(), ...s,
  };
}
