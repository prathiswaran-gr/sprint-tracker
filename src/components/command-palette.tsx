"use client";

import { Check, Compass, FolderKanban, Moon, Plus, Zap } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut,
} from "@/components/ui/command";
import { useAccent } from "@/hooks/use-accent";
import { useSprints } from "@/hooks/use-sprints";
import { ACCENTS, swatch } from "@/lib/accents";
import { setPaletteOpen, usePaletteContext, usePaletteOpen } from "@/lib/palette-store";
import { DifficultyDot } from "@/components/sprint/chips";

export const openCommandPalette = () => setPaletteOpen(true);

export function CommandPalette() {
  const open = usePaletteOpen();
  const ctx = usePaletteContext();
  const { data: sprints } = useSprints();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [accent, setAccent] = useAccent({ syncToAccount: true });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPaletteOpen(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const run = (fn: () => void) => () => {
    setPaletteOpen(false);
    fn();
  };

  return (
    <CommandDialog open={open} onOpenChange={setPaletteOpen} title="Command palette" description="Search problems, sprints and actions">
      <Command>
        <CommandInput placeholder="Search problems, sprints, actions…" />
        <CommandList className="max-h-[60vh]">
          <CommandEmpty>No results.</CommandEmpty>
          {ctx && ctx.actions.length > 0 && (
            <CommandGroup heading="Actions">
              {ctx.actions.map((a) => (
                <CommandItem key={a.id} onSelect={run(a.run)}>
                  <Zap /> {a.label}
                  {a.shortcut && <CommandShortcut>{a.shortcut}</CommandShortcut>}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {ctx && ctx.problems.length > 0 && (
            <CommandGroup heading="Problems">
              {ctx.problems.map((p) => (
                <CommandItem key={p.id} value={`${p.name} ${p.id}`} keywords={[...p.topics, ...p.companies]} onSelect={run(() => ctx.onSelectProblem(p))}>
                  {p.done_at ? <Check className="text-basic" /> : <DifficultyDot difficulty={p.difficulty} />}
                  <span className="truncate">{p.name}</span>
                  <CommandShortcut>Day {p.day_no}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          <CommandGroup heading="Sprints">
            {sprints?.map((s) => (
              <CommandItem key={s.id} value={`sprint ${s.title} ${s.id}`} onSelect={run(() => router.push(`/app/s/${s.id}`))}>
                <FolderKanban /> {s.title}
              </CommandItem>
            ))}
            <CommandItem onSelect={run(() => router.push("/app/import"))}>
              <Plus /> New sprint from xlsx
            </CommandItem>
            <CommandItem onSelect={run(() => router.push("/app/explore"))}>
              <Compass /> Explore public sheets
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Preferences">
            <CommandItem onSelect={run(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))}>
              <Moon /> Toggle light / dark
            </CommandItem>
            {ACCENTS.map((a) => (
              <CommandItem key={a.id} value={`theme colour ${a.label}`} onSelect={run(() => setAccent(a.id))}>
                <span className="size-3.5 rounded-full" style={{ background: swatch(a) }} />
                Theme colour: {a.label}
                {accent === a.id && <Check className="ml-auto" />}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
