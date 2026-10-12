"use client";

import { format } from "date-fns";
import { useCallback, useEffect, useRef, useState } from "react";
import { isOver, pause as pauseState, remaining, resume as resumeState, startPhase, type FocusPhase, type FocusState } from "@/lib/buddy/focus";
import { load, save } from "@/lib/buddy/storage";

/** Pomodoro state, persisted so it survives navigation and reloads. `onEnd` fires once per finished phase. */
export function useFocus(onEnd: (phase: FocusPhase) => void) {
  const [state, setState] = useState<FocusState | null>(() => load("focus"));
  const [now, setNow] = useState(() => Date.now());
  const onEndRef = useRef(onEnd);
  useEffect(() => {
    onEndRef.current = onEnd;
  });

  const update = useCallback((next: FocusState | null) => {
    save("focus", next);
    setState(next);
  }, []);

  useEffect(() => {
    if (!state || state.endsAt == null) return;
    const id = setInterval(() => {
      const t = Date.now();
      if (!isOver(state, t)) return setNow(t);
      clearInterval(id);
      update(null);
      if (state.phase === "focus") {
        const day = format(t, "yyyy-MM-dd");
        const prev = load("focusDone");
        save("focusDone", { date: day, count: prev.date === day ? prev.count + 1 : 1 });
      }
      onEndRef.current(state.phase);
    }, 1000);
    return () => clearInterval(id);
  }, [state, update]);

  const start = useCallback(
    (phase: FocusPhase = "focus") => {
      const t = Date.now();
      setNow(t);
      update(startPhase(phase, t));
    },
    [update],
  );
  const pause = useCallback(() => {
    if (state) update(pauseState(state, Date.now()));
  }, [state, update]);
  const resume = useCallback(() => {
    if (!state) return;
    const t = Date.now();
    setNow(t);
    update(resumeState(state, t));
  }, [state, update]);
  const stop = useCallback(() => update(null), [update]);

  return { state, remaining: state ? remaining(state, now) : 0, running: state?.endsAt != null, start, pause, resume, stop };
}

export type FocusControls = ReturnType<typeof useFocus>;
