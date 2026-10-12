import { cn } from "cn";
import { formatClock, type FocusPhase } from "@/lib/buddy/focus";

const R = 30;
const C = 2 * Math.PI * R;

/** Countdown ring that wraps the mini mascot during a focus session or break. */
export function FocusRing({
  remaining,
  total,
  phase,
  paused,
  children,
}: {
  remaining: number;
  total: number;
  phase: FocusPhase;
  paused: boolean;
  children: React.ReactNode;
}) {
  const frac = total > 0 ? Math.min(1, remaining / total) : 0;
  return (
    <div className="relative grid size-17 place-items-center">
      <svg viewBox="0 0 68 68" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="34" cy="34" r={R} fill="none" strokeWidth="4" className="stroke-muted" />
        <circle
          cx="34"
          cy="34"
          r={R}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - frac)}
          className={cn(
            "transition-[stroke-dashoffset] duration-1000 ease-linear",
            phase === "break" ? "stroke-emerald-500" : "stroke-primary",
            paused && "opacity-50",
          )}
        />
      </svg>
      {children}
      <span className="absolute -bottom-4 rounded bg-background/90 px-1 font-mono text-[10px] tabular-nums shadow-sm">
        {formatClock(remaining)}
      </span>
    </div>
  );
}
