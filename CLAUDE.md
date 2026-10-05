# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # dev server
npm run build        # production build
npm test             # run all tests (Vitest)
npm run test:watch   # watch mode
npx vitest run src/path/to/file.test.tsx  # single test file
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
```

## Architecture

**Sprintboard** — DSA prep sheet tracker. Import `.xlsx`, track problems day-by-day, Google OAuth via Supabase.

### Key conventions

- `@/*` → `src/*` (path alias)
- All Supabase DB calls go through `src/lib/api.ts` — never call Supabase directly from components
- Two Supabase clients: `supabaseBrowser()` (singleton, client-side) and `supabaseServer()` (per-request, server-side from cookies)
- Auth guard lives in `src/app/app/layout.tsx` (Server Component) — redirects unauthenticated users to `/`
- Middleware auth logic is in `src/proxy.ts`

### State management

| State type | Tool |
|---|---|
| Server/async state | TanStack React Query (staleTime: 30s) |
| URL / filter state | nuqs — `useFilters()` in `src/hooks/use-filters.ts` |
| Sprint actions (cross-component) | React Context — `SprintActionsProvider` in `src/components/sprint/sprint-context.tsx` |
| Accent color | localStorage + Supabase user metadata |

Filters are always URL state via nuqs — never use local state for filter values.

### Mutations

Use the `useOptimistic` helper in `src/hooks/use-sprint.ts` for any mutation needing instant UI feedback. Pattern: cancel in-flight query → apply optimistic cache update → roll back + toast on failure.

Complex DB operations use Supabase RPCs (e.g. `reschedule_problems`, `copy_public_sheet`, `create_group`).

### Testing

Tests colocated alongside source as `*.test.{ts,tsx}`.

- Use `renderWithProviders()` from `src/test/render.tsx` — wraps with QueryClient + NuqsTestingAdapter
- Mock `@/lib/api` with `vi.mock` + `vi.hoisted` pattern (see `src/components/sprint/sprint-view.test.tsx` for reference)
- Test fixtures in `src/test/fixtures/`
