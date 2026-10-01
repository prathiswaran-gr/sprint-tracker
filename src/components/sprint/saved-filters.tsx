"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import * as api from "@/lib/api";
import { DEFAULT_FILTERS, filtersSchema, isFiltering, type Filters } from "@/lib/filters";

export function SavedFilters({ filters, onApply }: { filters: Filters; onApply: (f: Filters) => void }) {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["saved-filters"], queryFn: api.listSavedFilters });
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");

  const save = useMutation({
    mutationFn: () => api.createSavedFilter(name.trim(), { ...filters, sort: undefined, dir: undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saved-filters"] });
      setNaming(false);
      setName("");
      toast.success("Filter saved");
    },
    onError: (e) => toast.error("Couldn't save filter", { description: e.message }),
  });
  const remove = useMutation({
    mutationFn: api.deleteSavedFilter,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-filters"] }),
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-lg"><Bookmark className="size-3.5" /> Saved</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel>Saved filters</DropdownMenuLabel>
          {data.length === 0 && <p className="px-2 py-1.5 text-xs text-muted-foreground">None yet — set filters, then save.</p>}
          {data.map((sf) => (
            <DropdownMenuItem
              key={sf.id}
              onSelect={() => onApply({ ...DEFAULT_FILTERS, ...filtersSchema.partial().parse(sf.query), sort: filters.sort, dir: filters.dir })}
              className="group"
            >
              <span className="flex-1 truncate">{sf.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); remove.mutate(sf.id); }}
                className="rounded p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive"
                aria-label={`Delete ${sf.name}`}
              >
                <Trash2 className="size-3.5" />
              </button>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={!isFiltering(filters)} onSelect={() => setNaming(true)}>
            <Plus /> Save current filters
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={naming} onOpenChange={setNaming}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Save filter</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) save.mutate(); }} className="grid gap-4">
            <Input autoFocus placeholder="e.g. Google · Core · Todo" value={name} onChange={(e) => setName(e.target.value)} />
            <DialogFooter><Button type="submit" disabled={!name.trim() || save.isPending}>Save</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
