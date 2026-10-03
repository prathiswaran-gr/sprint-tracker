"use client";

import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Facet } from "@/lib/filters";
import { cn } from "@/lib/utils";

export function FacetSelect({ label, facets, value, onChange, searchable = true, format = (v) => v }: {
  label: string; facets: Facet[]; value: string[]; onChange: (v: string[]) => void; searchable?: boolean;
  format?: (v: string) => string;
}) {
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-1.5 rounded-lg", value.length && "border-primary/50 bg-primary/10 text-foreground")}>
          {label}
          {value.length > 0 && (
            <span className="rounded bg-primary px-1 text-[10px] font-semibold text-primary-foreground tabular-nums">{value.length}</span>
          )}
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          {searchable && <CommandInput placeholder={`Search ${label.toLowerCase()}…`} />}
          <CommandList className="max-h-72">
            <CommandEmpty>Nothing found.</CommandEmpty>
            <CommandGroup>
              {facets.map((f) => {
                const on = value.includes(f.value);
                return (
                  <CommandItem key={f.value} value={f.value} keywords={[format(f.value)]} onSelect={() => toggle(f.value)} className="gap-2">
                    <span className={cn("flex size-4 items-center justify-center rounded border", on && "border-primary bg-primary text-primary-foreground")}>
                      {on && <Check className="size-3" />}
                    </span>
                    <span className="flex-1 truncate">{format(f.value)}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{f.count}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
          {value.length > 0 && (
            <div className="border-t p-1">
              <Button variant="ghost" size="sm" className="w-full" onClick={() => onChange([])}>Clear</Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
