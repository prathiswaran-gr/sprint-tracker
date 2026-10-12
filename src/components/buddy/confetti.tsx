"use client";

import { motion, useReducedMotion } from "motion/react";

const COLORS = ["var(--primary)", "#f59e0b", "#10b981", "#ec4899", "#3b82f6"];
const PIECES = Array.from({ length: 20 }, (_, i) => ({
  i,
  angle: (i / 20) * Math.PI * 2,
  dist: 50 + ((i * 37) % 40),
  spin: (i % 2 ? 1 : -1) * (180 + i * 20),
  color: COLORS[i % COLORS.length],
}));

/** One burst per `burstKey` change (0 = none yet). */
export function Confetti({ burstKey }: { burstKey: number }) {
  const reduce = useReducedMotion();
  if (reduce || burstKey === 0) return null;
  return (
    <div key={burstKey} aria-hidden data-testid="confetti" className="pointer-events-none absolute top-1/2 left-1/2">
      {PIECES.map((p) => (
        <motion.span
          key={p.i}
          className="absolute size-1.5 rounded-sm"
          style={{ background: p.color }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: Math.cos(p.angle) * p.dist, y: Math.sin(p.angle) * p.dist - 30, opacity: 0, rotate: p.spin }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
