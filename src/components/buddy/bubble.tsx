"use client";

import { X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ActionId, Bubble } from "@/lib/buddy/bubbles";

export const BUBBLE_MS = 8000;

/** Speech bubble beside Sprinty. Auto-hides after BUBBLE_MS unless hovered. */
export function SpeechBubble({
  bubble,
  onAction,
  onDismiss,
}: {
  bubble: Bubble;
  onAction: (id: ActionId) => void;
  onDismiss: (id: string) => void;
}) {
  const reduce = useReducedMotion();
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (hover) return;
    const t = setTimeout(() => onDismiss(bubble.id), BUBBLE_MS);
    return () => clearTimeout(t);
  }, [hover, onDismiss, bubble.id]);

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6, x: -12 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="pointer-events-auto relative mb-6 w-72 max-w-[80vw] origin-bottom-left rounded-2xl border bg-popover p-3 pr-8 text-sm text-popover-foreground shadow-lg"
    >
      <p className="whitespace-pre-line">{bubble.text}</p>
      {bubble.actions.length > 0 && (
        <div className="mt-2 flex gap-2">
          {bubble.actions.map((a, i) => (
            <Button
              key={a.id}
              size="sm"
              variant={i === 0 ? "default" : "ghost"}
              onClick={() => (a.id === "dismiss" ? onDismiss(bubble.id) : onAction(a.id))}
            >
              {a.label}
            </Button>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => onDismiss(bubble.id)}
        aria-label="Dismiss"
        className="absolute top-2 right-2 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="size-3.5" />
      </button>
    </motion.div>
  );
}
