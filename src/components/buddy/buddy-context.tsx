"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

export type BuddyEvent = { type: "solved" } | { type: "startFocus" };
type Listener = (e: BuddyEvent) => void;
interface Bus {
  notify: Listener;
  subscribe: (l: Listener) => () => void;
}

const noop: Bus = { notify: () => {}, subscribe: () => () => {} };
const Ctx = createContext<Bus>(noop);

/** Lets anything under /app tell Sprinty what happened without prop drilling. */
export function BuddyProvider({ children }: { children: React.ReactNode }) {
  const [bus] = useState<Bus>(() => {
    const listeners = new Set<Listener>();
    return {
      notify: (e) => listeners.forEach((l) => l(e)),
      subscribe: (l) => {
        listeners.add(l);
        return () => {
          listeners.delete(l);
        };
      },
    };
  });
  return <Ctx.Provider value={bus}>{children}</Ctx.Provider>;
}

/** `notify` is a no-op outside a BuddyProvider, so hooks using it stay testable in isolation. */
export const useBuddy = () => useContext(Ctx);

export function useBuddyEvents(fn: Listener) {
  const bus = useBuddy();
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  });
  useEffect(() => bus.subscribe((e) => ref.current(e)), [bus]);
}
