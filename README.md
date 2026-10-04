# Sprintboard

Turn an `.xlsx` DSA prep sheet into a day-by-day sprint tracker. Sign in with Google, then:

- **Import** any sheet. Columns (Name, Url, Subject, Difficulty, Companies, Topics, Sprint, Day) are auto-detected, and you can fix the mapping before importing. Parsing happens in the browser.
- **Track** progress. Mark problems done, star them to revisit, and write Markdown notes with highlighted code (autosaved).
- **Filter & sort** by company, topic, difficulty, subject and status, with free-text search. Save filter combos you use often.
- **Reschedule**:
  - Set a start date, skip weekends and add rest days.
  - Drag problems between days, or use "Move to day…" on touch.
  - **Shift backlog** moves your earliest unfinished day to today and slides everything unfinished after it forward.
- **Public sheets**: make a sprint public (Settings → Sharing). It then appears in **Explore** (`/app/explore`), and other signed-in users can view the problem list and **copy** it as their own sprint. Your progress and notes are never shared.
- **Study groups**: start a group from any sprint (header → **Group**) and share the invite link. Each member gets their own copy of the sheet, and everyone sees who completed each problem: avatars on every problem card, a leaderboard, and a member-by-problem progress grid. Only done/not-done is shared; notes and stars stay private.
- **Stats**: streaks, a 26-week heatmap, solved-per-day, and completion by difficulty, topic and company.
- **Keyboard**: `⌘K` palette · `j/k` move · `x` done · `s` star · `n` notes · `o` open · `m` move · `/` search · `t` view · `g t` today.

Stack: Next.js 16 (App Router, Turbopack, `proxy.ts`), React 19, Tailwind v4, shadcn/ui (Radix), Supabase (Postgres + Google OAuth + RLS), TanStack Query/Virtual, dnd-kit, SheetJS, nuqs, Recharts, Vitest.

## Setup

### 1. Supabase project

1. Create a project at <https://supabase.com/dashboard>.
2. **SQL Editor**: run each file in [`supabase/migrations/`](supabase/migrations) **in filename order**:
   `20260930000000_init.sql`, then `20261003000000_public_sheets.sql`, then `20261004000000_study_groups.sql`.
   With the Supabase CLI you can run `supabase link` and then `supabase db push` instead.
3. **Project Settings → API**: copy the Project URL and the publishable (anon) key.

### 2. Google OAuth client

1. Open <https://console.cloud.google.com/apis/credentials>. Configure the OAuth consent screen (External, add your email as a test user), then go to **Create credentials → OAuth client ID → Web application**.
2. **Authorized JavaScript origins**: `http://localhost:3000` and your production URL.
3. **Authorized redirect URIs**: `https://<your-project-ref>.supabase.co/auth/v1/callback`.
4. Copy the Client ID and Client secret.

### 3. Connect Google to Supabase

1. Supabase → **Authentication → Sign In / Providers → Google**. Enable it and paste the Client ID and secret.
2. **Authentication → URL Configuration**:
   - **Site URL**: your production URL, or `http://localhost:3000` for now.
   - **Redirect URLs**: `http://localhost:3000/auth/callback`, `https://<your-domain>/auth/callback`, and optionally `https://*-<team>.vercel.app/auth/callback` for previews.

### 4. Run locally

```bash
cp .env.example .env.local   # fill in URL + publishable key
npm install
npm run dev                  # http://localhost:3000
```

### 5. Deploy to Vercel

Import the repo in Vercel and add the two `NEXT_PUBLIC_SUPABASE_*` env vars. After the first deploy, add the production domain to Google (JS origins) and Supabase (Site URL + Redirect URLs).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm test` | Unit + component tests (Vitest) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run build` | Production build |

## Layout

```
src/
  app/                  routes: landing, /app, /app/import, /app/s/[id], /app/s/[id]/stats, /auth/*
  proxy.ts              session refresh + /app guard
  lib/
    xlsx/               parseWorkbook (hyperlink-aware) + detectMapping/toProblems
    schedule.ts         plan day ↔ date, currentPlanDay, shiftBacklog, sprintForDay
    filters.ts          Filters schema, applyFilters, facets
    stats.ts            streaks, heatmap, summary, breakdown
    api.ts              Supabase data access (RLS-scoped)
  hooks/                useSprint (optimistic mutations), useFilters (URL state), useShortcuts
  components/sprint/    timeline, table, filter bar, notes drawer, dialogs
supabase/migrations/    schema, RLS policies, reschedule RPC
```

## Data & privacy

Every table has row-level security (`user_id = auth.uid()`), so users only see their own sprints. The uploaded file is never stored, only the parsed rows. Person-progress columns in the sheet (e.g. "Prathis", "Eswaran") are ignored on import.
