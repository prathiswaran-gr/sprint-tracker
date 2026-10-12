"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import type { Mood } from "@/lib/buddy/bubbles";

const MOUTH: Record<Mood, string> = {
  idle: "M 26 40 Q 32 43 38 40",
  happy: "M 25 39 Q 32 45 39 39",
  cheer: "M 25 38 Q 32 47 39 38 Z",
  sleepy: "M 28 41 L 36 41",
  focused: "M 27 41 L 37 41",
  concerned: "M 26 43 Q 32 39 38 43",
};

/** 120 ms blinks at random 2.5–5.5 s gaps. */
function useBlink(enabled: boolean) {
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(() => {
        setClosed(true);
        t = setTimeout(() => {
          setClosed(false);
          loop();
        }, 120);
      }, 2500 + Math.random() * 3000);
    };
    loop();
    return () => clearTimeout(t);
  }, [enabled]);
  return enabled && closed;
}

/** Sprinty: accent-coloured robot blob. Changing `bounceKey` replays the entrance hop. */
export function Mascot({ mood, size = 56, bounceKey = 0 }: { mood: Mood; size?: number; bounceKey?: number }) {
  const reduce = useReducedMotion();
  const blink = useBlink(!reduce && mood !== "sleepy");
  const eyeRy = mood === "sleepy" ? 1 : mood === "focused" ? 2.5 : blink ? 0.4 : 3.5;
  const float = reduce ? undefined : mood === "cheer" ? { y: [0, -10, 0, -5, 0] } : { y: [0, -2, 0] };

  return (
    <motion.svg
      key={bounceKey}
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden
      data-mood={mood}
      animate={float}
      transition={mood === "cheer" ? { duration: 0.8 } : { duration: 3, repeat: Infinity, ease: "easeInOut" }}
      className="drop-shadow-md"
    >
      <line x1="32" y1="6" x2="32" y2="14" strokeWidth="2" strokeLinecap="round" className="stroke-primary" />
      <circle cx="32" cy="6" r="3" className="fill-primary" />
      <rect x="8" y="14" width="48" height="44" rx="18" className="fill-primary" />
      <rect x="14" y="20" width="36" height="30" rx="12" className="fill-background" />
      {mood === "cheer" ? (
        <g fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-foreground">
          <path d="M 21 32 L 24.5 28 L 28 32" />
          <path d="M 36 32 L 39.5 28 L 43 32" />
        </g>
      ) : (
        <g className="fill-foreground">
          <motion.ellipse cx="24.5" cy="31" rx="3.5" initial={false} animate={{ ry: eyeRy }} transition={{ duration: 0.08 }} />
          <motion.ellipse cx="39.5" cy="31" rx="3.5" initial={false} animate={{ ry: eyeRy }} transition={{ duration: 0.08 }} />
        </g>
      )}
      <path
        d={MOUTH[mood]}
        strokeWidth="2.5"
        strokeLinecap="round"
        className={mood === "cheer" ? "fill-foreground stroke-foreground" : "fill-none stroke-foreground"}
      />
      {mood === "concerned" && <circle cx="47" cy="25" r="2" className="fill-sky-400" />}
      {mood === "sleepy" && (
        <text x="47" y="17" fontSize="9" className="fill-muted-foreground">
          z
        </text>
      )}
    </motion.svg>
  );
}
