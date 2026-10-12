"use client";

import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { AnimatePresence } from "motion/react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSessionUser } from "@/components/shell/session-user";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { buddyDoneKey, useBuddyStats } from "@/hooks/use-buddy-stats";
import { celebrateBubble, enqueue, focusEndBubble, greetingBubble, nudgeBubble, type ActionId, type Bubble } from "@/lib/buddy/bubbles";
import { phaseLength, type FocusPhase } from "@/lib/buddy/focus";
import { load, save, type BuddySettings } from "@/lib/buddy/storage";
import { dayStats, shouldIdleNudge } from "@/lib/buddy/triggers";
import { SpeechBubble } from "./bubble";
import { useBuddyEvents } from "./buddy-context";
import { Confetti } from "./confetti";
import { FocusRing } from "./focus-ring";
import { Mascot } from "./mascot";
import { BuddyPanel } from "./panel";
import { ScheduleWatch } from "./schedule-watch";
import { useFocus } from "./use-focus";

const todayStr = () => format(new Date(), "yyyy-MM-dd");
const PLAIN_GAP_MS = 60_000;
const NUDGE_CHECK_MS = 60_000;
const SPRINT_PATH = /^\/app\/s\/([^/]+)$/;

/** Sprinty: greets, celebrates solves, runs focus sessions and nudges idle users. Client-only (reads localStorage). */
export function Buddy() {
  const user = useSessionUser();
  const qc = useQueryClient();
  const { stats } = useBuddyStats();
  const pathname = usePathname() ?? "";
  const sprintId = SPRINT_PATH.exec(pathname)?.[1] ?? null;

  const [settings, setSettingsState] = useState<BuddySettings>(() => load("settings"));
  const [queue, setQueue] = useState<Bubble[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [burst, setBurst] = useState(0);
  const [bounce, setBounce] = useState(0);
  const [focusCount, setFocusCount] = useState(() => {
    const d = load("focusDone");
    return d.date === todayStr() ? d.count : 0;
  });

  // Read inside callbacks; kept in sync after every render.
  const quiet = useRef({ hidden: settings.hidden, focusing: false });
  const push = useCallback((b: Bubble) => {
    if (quiet.current.hidden || (quiet.current.focusing && b.kind !== "focusEnd")) return;
    save("lastMsgId", b.id);
    setQueue((q) => enqueue(q, b));
  }, []);
  const dismiss = useCallback((id: string) => setQueue((q) => q.filter((b) => b.id !== id)), []);

  const focus = useFocus((phase) => {
    if (phase === "focus") {
      setFocusCount(load("focusDone").count);
      setBurst((n) => n + 1);
    }
    push(focusEndBubble(phase, { lastId: load("lastMsgId") }));
  });
  const focusing = focus.state != null;
  useEffect(() => {
    quiet.current = { hidden: settings.hidden, focusing };
  });

  const { start: startPhase } = focus;
  const startFocus = useCallback(
    (phase: FocusPhase = "focus") => {
      setQueue([]);
      setPanelOpen(false);
      startPhase(phase);
    },
    [startPhase],
  );

  const setSettings = (next: BuddySettings) => {
    save("settings", next);
    setSettingsState(next);
    if (next.hidden) {
      setQueue([]);
      setPanelOpen(false);
    }
  };

  // Greeting: first load of the local day.
  useEffect(() => {
    if (!stats || settings.hidden || focusing) return;
    const today = todayStr();
    if (load("lastGreetDate") === today) return;
    save("lastGreetDate", today);
    push(greetingBubble(stats, user?.name ?? "", new Date().getHours(), { lastId: load("lastMsgId") }));
  }, [stats, settings.hidden, focusing, user?.name, push]);

  // Celebrate: bump the cached count right away so rapid solves stack correctly; the mutation refetches on settle.
  const lastSolveAt = useRef(0);
  const lastPlainAt = useRef(0);
  const celebrate = () => {
    const now = Date.now();
    lastSolveAt.current = now;
    const doneAts = qc.getQueryData<string[]>(buddyDoneKey);
    if (!doneAts) return;
    const before = dayStats(doneAts, todayStr());
    qc.setQueryData<string[]>(buddyDoneKey, [...doneAts, new Date(now).toISOString()]);
    const b = celebrateBubble(before, { lastId: load("lastMsgId") });
    setBounce((n) => n + 1);
    if (b.confetti) setBurst((n) => n + 1);
    else if (now - lastPlainAt.current < PLAIN_GAP_MS) return;
    else lastPlainAt.current = now;
    push(b);
  };

  useBuddyEvents((e) => {
    if (e.type === "startFocus") startFocus("focus");
    else if (e.type === "solved") celebrate();
  });

  // Idle nudge: only on a sprint page, tab visible, user active but not solving.
  const lastActivity = useRef(0);
  const idleSince = useRef(0);
  useEffect(() => {
    idleSince.current = Date.now();
  }, [pathname]);
  useEffect(() => {
    const mark = () => {
      lastActivity.current = Date.now();
    };
    window.addEventListener("pointermove", mark, { passive: true });
    window.addEventListener("keydown", mark);
    return () => {
      window.removeEventListener("pointermove", mark);
      window.removeEventListener("keydown", mark);
    };
  }, []);
  useEffect(() => {
    if (!sprintId || !settings.nudges || settings.hidden || focusing) return;
    const id = setInterval(() => {
      const now = Date.now();
      if (document.visibilityState !== "visible") return;
      const since = Math.max(idleSince.current, lastSolveAt.current);
      if (!shouldIdleNudge({ now, lastActivity: lastActivity.current, idleSince: since, lastNudgeAt: load("lastNudgeAt") })) return;
      save("lastNudgeAt", now);
      push(nudgeBubble({ lastId: load("lastMsgId") }));
    }, NUDGE_CHECK_MS);
    return () => clearInterval(id);
  }, [sprintId, settings.nudges, settings.hidden, focusing, push]);

  const onAction = (id: ActionId) => {
    if (id === "startFocus") startFocus("focus");
    else if (id === "startBreak") startFocus("break");
  };

  if (settings.hidden) {
    return (
      <button
        type="button"
        aria-label="Show Sprinty"
        onClick={() => setSettings({ ...settings, hidden: false })}
        className="fixed bottom-5 left-5 z-40 size-3 rounded-full bg-primary/50 transition hover:scale-150 hover:bg-primary md:left-69"
      />
    );
  }

  const current = focusing ? null : (queue[0] ?? null);
  const mood = current?.mood ?? "idle";

  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-40 flex items-end gap-2 md:left-68">
      {sprintId && <ScheduleWatch sprintId={sprintId} onStatus={push} />}
      <div className="relative origin-bottom-left max-md:scale-80">
        <Confetti burstKey={burst} />
        <Popover open={panelOpen} onOpenChange={setPanelOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Open Sprinty"
              className="pointer-events-auto block rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {focus.state ? (
                <FocusRing remaining={focus.remaining} total={phaseLength(focus.state.phase)} phase={focus.state.phase} paused={!focus.running}>
                  <Mascot mood={focus.state.phase === "break" ? "happy" : "focused"} size={44} />
                </FocusRing>
              ) : (
                <Mascot mood={mood} bounceKey={bounce} />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-72">
            <BuddyPanel
              stats={stats}
              focus={focus}
              focusCount={focusCount}
              settings={settings}
              onSettings={setSettings}
              onStartFocus={() => startFocus("focus")}
            />
          </PopoverContent>
        </Popover>
      </div>
      <AnimatePresence mode="wait">
        {current && <SpeechBubble key={current.id} bubble={current} onAction={onAction} onDismiss={dismiss} />}
      </AnimatePresence>
    </div>
  );
}
