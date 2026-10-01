# Sprint Viewer — Design + Implementation Plan

## Context
User follows a DSA/CS prep sheet (takeuforward links) kept as xlsx: ~600+ rows across 20 sprints / 136 days.
Tracking progress in spreadsheet columns ("Prathis", "Eswaran" = "Completed") is clunky. Goal: beautiful personal
web app — Google login, upload xlsx → sprint viewer, mark done, notes, sort/filter (esp. by company), reschedule,
stats. Empty repo (`/Users/prathis-21531/Development/sprint-website`, only `DSA Prep Sheet.pdf`), not a git repo yet.

**Reference sheet columns:** `Name | Url | Subject (dsa/oops/dbms…) | Difficulty (Basic/Core/Pro, may be blank) |
Companies ("A | B | C") | Topics ("Arrays | Hashing") | Sprint (int) | Day (int, global 1..136) | <person cols…>`.
Some rows have blank Url text but a hyperlink on the cell → parser must read cell hyperlinks.

## Decisions (from grilling)
- Personal sheets only (no sharing). Person columns ignored on import.
- User can own **multiple sprints** (sidebar switcher).
- Modify = **reschedule only**: drag between days, start-date → calendar mapping, skip weekends + rest days,
  auto-shift backlog (shift whole plan forward).
- Status = Todo/Done (`done_at` timestamp) + separate **star/revisit** flag.
- Notes = Markdown + syntax-highlighted code, side drawer, autosave.
- Views = Timeline (Sprint → Day cards, drag) ⇄ Table (dense grid), toggle.
- Extras: stats dashboard (heatmap, streak, breakdowns), Cmd+K search, saved filters, dark mode, keyboard shortcuts.
- Style: Linear-like minimal, dark-first, difficulty chips (Basic green / Core amber / Pro red). Fully responsive
  (touch: "Move to day…" menu instead of drag).
- Parsing in browser (SheetJS), auto-detect headers + mapping/preview step; raw file not stored.
- Stack: Next.js 16 + Supabase (Postgres, Google OAuth, RLS), deploy Vercel. User creates OAuth creds.

## Stack
Next.js 16 (App Router, Turbopack, `proxy.ts`), React 19, TypeScript strict, Tailwind v4, shadcn/ui (Radix),
Motion, `@supabase/ssr` + `@supabase/supabase-js`, TanStack Query (optimistic mutations), TanStack Table +
`@tanstack/react-virtual`, `@dnd-kit/core`, SheetJS (`xlsx` from cdn.sheetjs.com tarball — npm copy is stale),
Zod, `nuqs` (filters in URL), `cmdk`, `next-themes`, `date-fns`, `react-markdown` + `remark-gfm` + `rehype-shiki`,
shadcn Charts (Recharts). Tests: Vitest + Testing Library; Playwright smoke. pnpm.

## Data model — `supabase/migrations/0001_init.sql`
```
sprints(id uuid pk, user_id uuid → auth.users, title text, start_date date null,
        skip_weekends bool default false, rest_days date[] default '{}', created_at, updated_at)
problems(id uuid pk, sprint_id → sprints on delete cascade, user_id uuid, position int,
         name text, url text, subject text, difficulty text null,
         companies text[], topics text[],
         sprint_no int, day_no int, original_day_no int,
         done_at timestamptz null, starred bool default false, notes text default '',
         updated_at)
saved_filters(id, user_id, name, query jsonb, created_at)
```
- RLS on all tables: `user_id = auth.uid()` for select/insert/update/delete.
- Indexes: `problems(sprint_id, day_no)`, GIN on `companies`, `topics`.
- Progress lives on the problem row (personal sheets → no join table needed).

## Core pure modules (`src/lib/`, fully unit-tested)
- `xlsx/parse.ts` — `parseWorkbook(ArrayBuffer) → {sheets, headers, rows}`; reads hyperlinks (`cell.l.Target`)
  from Url or Name cell when Url text blank.
- `xlsx/mapColumns.ts` — header alias matching (`name|title|problem`, `url|link`, `companies|company`,
  `topics|tags`, `sprint`, `day`, …) case/space-insensitive → `ColumnMapping`; `toProblems(rows, mapping)`:
  split `|`, trim, dedupe; normalize difficulty; int coercion; skip rows with no name; report warnings.
- `schedule.ts` — `dayToDate(dayNo, cfg)` / `dateToDay(date, cfg)` where cfg = {startDate, skipWeekends, restDays};
  `shiftBacklog(problems, todayDay)` → changed rows. Rule: `d0 = min(day_no of undone where day_no < today)`,
  `delta = today − d0`; every **undone** problem with `day_no ≥ d0` gets `day_no += delta`; done rows untouched.
  `sprintForDay(day)` built from original data (days past last → last sprint) — used when dragging across sprints.
- `filters.ts` — `Filters` Zod schema {q, subjects[], difficulties[], companies[], topics[], status:
  all|todo|done|starred, dayRange, sort: day|name|difficulty|companyCount|doneAt, dir}; `applyFilters(problems, f)`;
  facet counts per company/topic for the filter UI. All filtering client-side (≈600 rows).
- `stats.ts` — totals by subject/difficulty/topic/company, `streak(doneDates, tz)`, heatmap buckets, pace
  (done vs. scheduled through today).

## Routes (`src/app/`)
- `/` landing + "Continue with Google" (`supabase.auth.signInWithOAuth({provider:'google'})`).
- `/auth/callback/route.ts` — exchange code for session.
- `proxy.ts` — refresh Supabase session; guard `/app/*`.
- `/app` — sprint list cards (progress ring, today count) + "New sprint" button.
- `/app/import` — dropzone → sheet picker → column-mapping dropdowns + 20-row preview + warnings → title/start date
  → bulk insert (chunks of 500) → redirect.
- `/app/s/[id]` — main viewer: header (title, progress bar, Today banner w/ overdue count + "Shift backlog"),
  FilterBar, `?view=timeline|table`.
- `/app/s/[id]/stats` — dashboard.
- `/app/s/[id]/settings` — rename, start date, skip weekends, rest-day calendar picker, delete sprint.

## Key components (`src/components/`)
- `FilterBar` — search, multi-select popovers w/ counts (Company, Topic, Subject, Difficulty), status tabs, sort,
  "Save filter" / saved-filter menu. State in URL via nuqs.
- `TimelineView` — Sprint accordion → Day sections (date label, Today/Overdue badge, done x/y) → `ProblemCard`
  (checkbox, name → external link, difficulty chip, topic chips, top-N company chips "+12", star, notes icon).
  dnd-kit drag card → day; touch/menu fallback "Move to day…".
- `TableView` — TanStack Table, virtualized, sortable headers, same row actions.
- `NotesDrawer` — shadcn Sheet; Write/Preview tabs; debounced (800 ms) autosave; shows problem meta + link.
- `CommandPalette` — Cmd+K: jump to problem, switch sprint, go to today, toggle theme.
- `StatsDashboard` — KPI tiles, heatmap calendar, streak, bars by difficulty/subject, top companies completion %.
- `useShortcuts` — `j/k` move focus, `x` toggle done, `s` star, `n` notes, `/` search, `t` toggle view, `g t` today.

## Data access
- `src/lib/supabase/{client,server}.ts` via `@supabase/ssr`.
- `src/hooks/useSprint(id)` — TanStack Query loads sprint + all problems once; mutations
  (`toggleDone`, `toggleStar`, `saveNotes`, `moveToDay`, `shiftBacklog`, `updateSettings`) optimistic with rollback
  + toast on error.

## Implementation phases (TDD for `src/lib/*`)
1. Scaffold: `git init`, `create-next-app` (TS, Tailwind v4, App Router), shadcn init, deps, Vitest config,
   `.env.example`, README setup guide (Google Cloud OAuth client → Supabase Google provider → redirect URLs →
   env vars `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). Save spec to
   `docs/superpowers/specs/2026-09-30-sprint-viewer-design.md`.
2. Supabase migration + generated types; auth (landing, callback, proxy, sign-out, user menu).
3. Parser + mapping (tests with fixture xlsx built from sample rows in the PDF, incl. hyperlink-only URL) → import UI.
4. Viewer: `useSprint`, TimelineView, TableView, ProblemCard, done/star mutations.
5. Filters/sort (tests) + FilterBar + saved filters.
6. Schedule lib (tests) + settings page + Today banner + drag/move + shift backlog.
7. Notes drawer (markdown + shiki).
8. Stats lib (tests) + dashboard.
9. Cmd+K, shortcuts, dark/light theme polish, responsive pass, empty/loading/error states, motion.
10. Playwright smoke (import fixture → mark done → filter by company → reload persists) against local Supabase
    (`supabase start`, test user via password auth seeded only in local env).

## Verification
- `pnpm test` — unit tests for parse/mapColumns/schedule/filters/stats green.
- `pnpm build` + `pnpm lint` + `tsc --noEmit` clean.
- Local run (`supabase start` + `pnpm dev`): sign in with Google (real creds) → import user's actual xlsx → verify
  row count matches sheet, companies/topics split, URLs present → mark done / star / note → reload persists →
  filter "Google + Core + Todo" → set start date + skip weekends → Today banner correct → shift backlog moves
  undone past items to today and slides future days → stats reflect completions → check on mobile viewport.
- Second Google account can't see first account's sprints (RLS check).
- Deploy to Vercel preview; add Vercel URL to Supabase + Google redirect allow-lists.

## Open items needing user action
- Create Supabase project + Google Cloud OAuth client (README steps), provide env vars.
- Share actual `.xlsx` file (PDF is export) for fixture + end-to-end validation.
