import type { PublicSheet } from "@/lib/types";

export const mkSheet = (p: Partial<PublicSheet> = {}): PublicSheet => ({
  id: "pub1", title: "DSA Prep Sheet", description: "Arrays to DP in 20 sprints", owner_name: "Prathis", owner_avatar: null,
  published_at: "2026-10-01T00:00:00Z", copy_count: 4, problem_count: 600, day_count: 136, sprint_count: 20,
  basic_count: 200, core_count: 300, pro_count: 100, topics: ["Arrays", "Hashing", "Graphs"],
  company_counts: { Google: 120, Amazon: 110, Meta: 90, Apple: 40, Zoho: 150, Adobe: 80 }, ...p,
});
