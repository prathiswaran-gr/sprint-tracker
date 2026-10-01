export type Difficulty = "Basic" | "Core" | "Pro";

export interface ProblemInput {
  position: number;
  name: string;
  url: string;
  subject: string;
  difficulty: Difficulty | null;
  companies: string[];
  topics: string[];
  sprint_no: number;
  day_no: number;
}

export interface Problem extends ProblemInput {
  id: string;
  sprint_id: string;
  original_day_no: number;
  done_at: string | null;
  starred: boolean;
  notes: string;
  updated_at?: string;
}

export interface Sprint {
  id: string;
  user_id: string;
  title: string;
  start_date: string | null; // yyyy-MM-dd
  skip_weekends: boolean;
  rest_days: string[]; // yyyy-MM-dd
  created_at: string;
  updated_at?: string;
}

export interface SavedFilter {
  id: string;
  user_id: string;
  name: string;
  query: Record<string, unknown>;
  created_at: string;
}
