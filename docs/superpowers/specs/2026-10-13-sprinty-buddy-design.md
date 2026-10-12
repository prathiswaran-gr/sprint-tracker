# Sprinty — motivational study buddy (design)

## Context
Users prep DSA via Sprintboard but nothing in-app keeps them going day to day. User wants a personal bot that pops up with a cool animation, greets them, compares today vs yesterday solved counts, keeps them motivated and focused, and stops prep from getting boring.

**Decisions made (by user):**
- Templates only, no LLM. Rule-picked messages from stats → $0 cost, instant, no server code, no API key.
- v1 behaviors: greeting + today/yesterday compare, celebrate solves, focus timer, idle nudge, schedule check.
- Look: custom inline-SVG mascot, accent-colored, mood expressions, animated with `motion` (already a dependency).

**Assumed (correct me if wrong):** name "Sprinty". Per-user only (not group-wide). Lives in the `/app` shell on every page. Settings in localStorage. Can be dismissed and muted, never nags.

**Success:** user opens app → Sprinty greets with real progress → solves get celebrated → focus sessions are easy to start → streaks go up.

## Architecture
One shell-level `<Buddy />` mounted in `AppShell`, plus `BuddyProvider` context exposing `notify(event)`. Pure logic (deciding messages and triggers) is split from UI so it can be unit-tested.

New dir `src/components/buddy/`:
| File | Job |
|---|---|
| `buddy-context.tsx` | `BuddyProvider` + `useBuddy()` → `{ notify(e: BuddyEvent) }`. Default ctx = no-op, so existing tests and hooks outside the provider don't break |
| `buddy.tsx` | Container: fixed bottom-left of content area (Toaster stays bottom-right). Holds message queue, open/closed panel, mood. Handles AnimatePresence pop-in/out |
| `mascot.tsx` | SVG robot-blob. Prop `mood: idle\|happy\|cheer\|sleepy\|focused\|concerned`. Blink loop, bounce, eye/mouth morph. Fill = accent CSS var |
| `bubble.tsx` | Speech bubble: text + up to 2 action buttons + ×. Auto-hide after ~8s unless hovered |
| `panel.tsx` | Opens on mascot click: today / yesterday / streak tiles, "Start focus" button, settings toggles (nudges on/off, hide Sprinty) |
| `focus-timer.tsx` | Pomodoro 25/5. While running, mascot shrinks to a ring countdown with `focused` mood |
| `confetti.tsx` | Burst of ~20 motion particles (no new dep) |

New pure modules in `src/lib/buddy/`:
| File | Job |
|---|---|
| `messages.ts` | Template pools keyed by situation, `{name}/{today}/{yesterday}/{diff}/{streak}/{behind}` interpolation, `pick(pool, rng)` that avoids repeating the last message (last-shown id kept in localStorage) |
| `triggers.ts` | `greetingSituation(stats, hour)`, `milestone(prevToday, newToday, yesterday, streak)`, `scheduleStatus(plannedDay, workingDay, problems)`, `shouldIdleNudge(lastActivity, lastSolve, lastNudge, now)` |
| `storage.ts` | Typed localStorage get/set: `settings`, `lastGreetDate`, `lastNudgeAt`, `focus` state, `lastMsgId` |

Data: add `listMyDoneTimestamps(since: string)` to `src/lib/api.ts` → `problems.select("done_at").eq("user_id", uid).gte("done_at", since)`, paginated with the existing `PAGE` loop. 60-day window. Query key `["buddy","done"]`.

Reuse: `heatmap()` + `streaks()` + `toLocalDate()` ([stats.ts](src/lib/stats.ts)), `currentPlanDay()` + `workingDay()` ([schedule.ts](src/lib/schedule.ts)), `useSprint()` cache ([use-sprint.ts](src/hooks/use-sprint.ts)), `useSessionUser` for name, `motion` + `useReducedMotion`.

## Behaviors
1. **Greeting**: first `/app` load per local day (`lastGreetDate`). Message picked by time of day (morning/afternoon/evening/late night) plus situation:
   - today > yesterday → "Already beat yesterday 🔥"
   - 0 today and streak > 0 in the evening → "streak at risk", mood `concerned`
   - 0 solved ever → onboarding welcome
   - else → "Yesterday 4 · Today 1 — 3 more to beat it"
   - Actions: [Start focus] [Later].
2. **Celebrate**: `toggleDone` in [use-sprint.ts:62](src/hooks/use-sprint.ts#L62) calls `notify({type:"solved"})` only on the not-done → done transition. Buddy optimistically bumps the today count, runs `milestone()`, shows confetti + `cheer` mood + message. Milestones: first solve of the day, tie with yesterday, beat yesterday, 5/10/15 today, streak extended. Non-milestone solves get a small bounce and a short line, rate-limited to 1 bubble per 60s. Invalidate `["buddy","done"]` on settle.
3. **Focus timer**: started from greeting, panel, or ⌘K command. State `{phase, endsAt, pausedRemaining}` kept in localStorage, so it survives navigation and reload. Ring countdown. On end: cheer + "Break 5 min" / "Another round". Count today's completed sessions. **While a focus session runs, all other bubbles are suppressed** (only solve confetti, silently). Optional `document.title` countdown.
4. **Idle nudge**: only on `/app/s/[id]` while the tab is visible and the user is active (pointer/key events throttled). Fires after 20 min with no solve, at most once per 30 min, never during focus, and only if nudges are enabled. Mood `sleepy`. Example: "Stuck? Try a hint from the link, or start a 25-min focus".
5. **Schedule check**: on sprint page load (once per sprint per day), using cached `useSprint` data: planned day `currentPlanDay(cfg, today)` vs `workingDay(problems, planned)`.
   - Behind → "Plan says day 12, you're on day 10 — 6 problems to catch up"
   - Ahead → praise
   - Rest day → "Rest day — enjoy, or sneak one in"

Queue: one bubble at a time, priority celebrate > focus end > schedule > greeting > nudge. The greeting and schedule check merge into one bubble when both fire on the same load.

## Edge cases / a11y
- `prefers-reduced-motion` → no confetti/bounce, fades only.
- Bubble uses `role="status" aria-live="polite"`. Mascot is a `<button aria-label="Open Sprinty">`. Esc closes.
- Hidden setting → only a tiny restore dot in the panel position.
- Mobile: smaller mascot, bubble max-w-[80vw].
- Fetch error → bot stays silent (no error toast).
- Timezone: all day math via `toLocalDate`.

## Testing (TDD)
- `src/lib/buddy/*.test.ts`: triggers (each situation, boundaries, rate limits with fixed `now`), `pick` no-repeat with a seeded rng, interpolation, storage round-trip.
- `src/components/buddy/buddy.test.tsx` via `renderWithProviders`, mock `@/lib/api` with the `vi.hoisted` pattern: greeting shows once per day; solve → celebrate bubble; focus timer with `vi.useFakeTimers` (start → ring → end message, bubbles suppressed); idle nudge fires/doesn't; hidden setting respected.
- Extend `use-sprint` test (or sprint-view test): `notify` called only on the done transition.

## Process after approval
1. Save this design to `docs/superpowers/specs/2026-10-13-sprinty-buddy-design.md` and commit (brainstorming spec step).
2. Invoke `superpowers:writing-plans` → detailed implementation plan → user picks execution method.

## Verification
- `npm test`, `npm run typecheck`, `npm run lint`.
- `npm run dev` → log in → check: greeting with correct today/yesterday counts; mark problem done → confetti + message; start focus → ring survives navigation and reload; set idle threshold to a short dev value → nudge appears; sprint behind plan → schedule message; toggle reduced motion in OS settings; mute/hide settings persist.
