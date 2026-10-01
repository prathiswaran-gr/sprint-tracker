"use client";

import { useEffect, useEffectEvent } from "react";

/** Single keys plus "g x" chords. Ignored while typing or when a dialog/menu is open. */
export function useShortcuts(map: Record<string, () => void>) {
  const run = useEffectEvent((key: string) => {
    const fn = map[key];
    if (fn) fn();
    return Boolean(fn);
  });

  useEffect(() => {
    let pendingG = false;
    let timer: ReturnType<typeof setTimeout>;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable=true]")) return;
      if (document.querySelector("[role=dialog], [role=menu], [role=listbox]")) return;

      const key = pendingG ? `g ${e.key}` : e.key;
      if (!pendingG && e.key === "g") {
        pendingG = true;
        timer = setTimeout(() => (pendingG = false), 800);
        return;
      }
      pendingG = false;
      clearTimeout(timer);
      if (run(key)) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
