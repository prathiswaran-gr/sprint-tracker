import type { Problem } from "@/lib/types";

let n = 0;
export function mkProblem(p: Partial<Problem> = {}): Problem {
  n++;
  return {
    id: `p${n}`, sprint_id: "s1", position: n, name: `Problem ${n}`, url: "", subject: "dsa",
    difficulty: "Core", companies: [], topics: [], sprint_no: 1, day_no: 1, original_day_no: p.day_no ?? 1,
    done_at: null, starred: false, notes: "", ...p,
  };
}
