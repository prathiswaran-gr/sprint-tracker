"use client";

import { Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export const SHORTCUTS: [string, string][] = [
  ["j / k", "Next / previous problem"],
  ["x", "Toggle done"],
  ["s", "Star to revisit"],
  ["n", "Open notes"],
  ["o", "Open problem link"],
  ["m", "Move to day…"],
  ["/", "Search"],
  ["t", "Toggle timeline / table"],
  ["g t", "Go to today"],
  ["⌘ K", "Command palette"],
];

export function ShortcutsHelp() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Keyboard shortcuts" className="text-muted-foreground max-md:hidden">
          <Keyboard />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64">
        <p className="mb-2 text-sm font-medium">Keyboard shortcuts</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
          {SHORTCUTS.map(([k, v]) => (
            <div key={k} className="contents">
              <dt><kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono">{k}</kbd></dt>
              <dd className="text-muted-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      </PopoverContent>
    </Popover>
  );
}
