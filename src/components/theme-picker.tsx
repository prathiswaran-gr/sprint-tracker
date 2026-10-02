"use client";

import { Check, Monitor, Moon, Palette, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAccent } from "@/hooks/use-accent";
import { ACCENTS, swatch } from "@/lib/accents";
import { cn } from "@/lib/utils";

const MODES = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
] as const;

// next-themes only knows the stored mode after mount.
const useMounted = () => useSyncExternalStore(() => () => {}, () => true, () => false);

export function ThemePicker({ syncToAccount = false }: { syncToAccount?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [accent, setAccent] = useAccent({ syncToAccount });
  const mounted = useMounted();

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <p className="text-xs font-medium text-muted-foreground">Mode</p>
        <div role="radiogroup" aria-label="Colour mode" className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
          {MODES.map(({ id, label, icon: Icon }) => {
            const active = mounted && theme === id;
            return (
              <button
                key={id}
                role="radio"
                aria-checked={active}
                onClick={() => setTheme(id)}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors",
                  active ? "bg-background font-medium text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" /> {label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid gap-2">
        <p className="text-xs font-medium text-muted-foreground">Theme colour</p>
        <div className="grid grid-cols-5 gap-2">
          {ACCENTS.map((a) => {
            const active = accent === a.id;
            return (
              <button
                key={a.id}
                onClick={() => setAccent(a.id)}
                aria-label={a.label}
                aria-pressed={active}
                title={a.label}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full ring-offset-2 ring-offset-popover transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active && "ring-2 ring-foreground/70",
                )}
                style={{ background: swatch(a) }}
              >
                {active && <Check className="size-4 text-white drop-shadow" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ThemeButton({ syncToAccount = false, side = "top", className }: {
  syncToAccount?: boolean; side?: "top" | "bottom"; className?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Appearance" className={cn("text-muted-foreground", className)}>
          <Palette />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" side={side} className="w-64">
        <ThemePicker syncToAccount={syncToAccount} />
      </PopoverContent>
    </Popover>
  );
}
