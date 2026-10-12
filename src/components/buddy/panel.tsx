"use client";

import { Pause, Play, Square, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { formatClock } from "@/lib/buddy/focus";
import type { BuddySettings } from "@/lib/buddy/storage";
import type { DayStats } from "@/lib/buddy/triggers";
import type { FocusControls } from "./use-focus";

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div aria-label={`${label}: ${value}`} className="rounded-lg border bg-muted/40 px-2 py-1.5 text-center">
      <div className="text-lg font-semibold tabular-nums">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

export function BuddyPanel({
  stats,
  focus,
  focusCount,
  settings,
  onSettings,
  onStartFocus,
}: {
  stats: DayStats | null;
  focus: FocusControls;
  focusCount: number;
  settings: BuddySettings;
  onSettings: (s: BuddySettings) => void;
  onStartFocus: () => void;
}) {
  const streak = stats?.streak ?? 0;
  return (
    <div className="space-y-3 text-sm">
      <p className="font-medium">Sprinty</p>
      <div className="grid grid-cols-3 gap-2">
        <Tile label="Today" value={String(stats?.today ?? 0)} />
        <Tile label="Yesterday" value={String(stats?.yesterday ?? 0)} />
        <Tile label="Streak" value={`${streak} ${streak === 1 ? "day" : "days"}`} />
      </div>

      {focus.state ? (
        <div className="flex items-center gap-2">
          <span className="font-mono tabular-nums">{formatClock(focus.remaining)}</span>
          <span className="text-muted-foreground">{focus.state.phase === "focus" ? "Focus" : "Break"}</span>
          <div className="ml-auto flex gap-1">
            {focus.running ? (
              <Button size="icon-xs" variant="ghost" aria-label="Pause" onClick={focus.pause}>
                <Pause />
              </Button>
            ) : (
              <Button size="icon-xs" variant="ghost" aria-label="Resume" onClick={focus.resume}>
                <Play />
              </Button>
            )}
            <Button size="icon-xs" variant="ghost" aria-label="Stop" onClick={focus.stop}>
              <Square />
            </Button>
          </div>
        </div>
      ) : (
        <Button className="w-full" onClick={onStartFocus}>
          <Timer /> Start 25-min focus
        </Button>
      )}
      <p className="text-xs text-muted-foreground">Focus sessions today: {focusCount}</p>

      <label className="flex items-center justify-between gap-2">
        <span>Idle nudges</span>
        <Switch checked={settings.nudges} onCheckedChange={(v) => onSettings({ ...settings, nudges: v })} aria-label="Idle nudges" />
      </label>
      <Button variant="ghost" size="sm" className="w-full" onClick={() => onSettings({ ...settings, hidden: true })}>
        Hide Sprinty
      </Button>
    </div>
  );
}
