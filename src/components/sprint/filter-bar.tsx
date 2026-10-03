"use client";

import { ArrowDownUp, CalendarRange, Rows3, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatSubject } from "@/lib/format";
import { DEFAULT_FILTERS, isFiltering, STATUSES, type Facet, type Filters } from "@/lib/filters";
import { FacetSelect } from "./facet-select";
import { SavedFilters } from "./saved-filters";

const SORT_LABELS: Record<Filters["sort"], string> = {
  day: "Plan day", name: "Name", difficulty: "Difficulty", companies: "# Companies", done: "Completed date",
};
const STATUS_LABELS: Record<Filters["status"], string> = { all: "All", todo: "To do", done: "Done", starred: "Revisit" };

export interface FilterBarProps {
  filters: Filters;
  setFilters: (f: Partial<Filters>) => void;
  facets: { companies: Facet[]; topics: Facet[]; subjects: Facet[]; difficulties: Facet[] };
  statusCounts: Record<Filters["status"], number>;
  view: "timeline" | "table";
  setView: (v: "timeline" | "table") => void;
  resultCount: number;
}

export function FilterBar({ filters, setFilters, facets, statusCounts, view, setView, resultCount }: FilterBarProps) {
  const active = isFiltering(filters);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="problem-search"
            value={filters.q}
            onChange={(e) => setFilters({ q: e.target.value })}
            placeholder="Search problems, topics, companies…"
            className="h-8 rounded-lg pr-8 pl-8"
          />
          {filters.q ? (
            <button onClick={() => setFilters({ q: "" })} className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Clear search">
              <X className="size-3.5" />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded border bg-muted px-1 font-mono text-[10px] text-muted-foreground max-sm:hidden">/</kbd>
          )}
        </div>
        <Tabs value={filters.status} onValueChange={(v) => setFilters({ status: v as Filters["status"] })}>
          <TabsList className="h-8">
            {STATUSES.map((s) => (
              <TabsTrigger key={s} value={s} className="gap-1.5 px-2.5 text-xs">
                {STATUS_LABELS[s]}
                <span className="text-[10px] text-muted-foreground tabular-nums">{statusCounts[s]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(v) => v && setView(v as "timeline" | "table")}
          variant="outline"
          size="sm"
          className="ml-auto"
        >
          <ToggleGroupItem value="timeline" aria-label="Timeline view" className="gap-1.5 px-2.5"><CalendarRange className="size-3.5" /><span className="max-sm:hidden">Timeline</span></ToggleGroupItem>
          <ToggleGroupItem value="table" aria-label="Table view" className="gap-1.5 px-2.5"><Rows3 className="size-3.5" /><span className="max-sm:hidden">Table</span></ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FacetSelect label="Company" facets={facets.companies} value={filters.companies} onChange={(companies) => setFilters({ companies })} />
        <FacetSelect label="Topic" facets={facets.topics} value={filters.topics} onChange={(topics) => setFilters({ topics })} />
        <FacetSelect label="Difficulty" facets={facets.difficulties} value={filters.difficulties} onChange={(difficulties) => setFilters({ difficulties })} searchable={false} />
        {facets.subjects.length > 1 && (
          <FacetSelect label="Subject" facets={facets.subjects} value={filters.subjects} onChange={(subjects) => setFilters({ subjects })} searchable={false} format={formatSubject} />
        )}
        <Select value={filters.sort} onValueChange={(sort) => setFilters({ sort: sort as Filters["sort"] })}>
          <SelectTrigger size="sm" className="h-8 w-auto gap-1.5 rounded-lg">
            <ArrowDownUp className="size-3.5 opacity-60" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SORT_LABELS).map(([k, label]) => <SelectItem key={k} value={k}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={() => setFilters({ dir: filters.dir === "asc" ? "desc" : "asc" })} className="rounded-lg text-xs">
          {filters.dir === "asc" ? "Asc" : "Desc"}
        </Button>
        {active && (
          <Button variant="ghost" size="sm" className="rounded-lg text-muted-foreground" onClick={() => setFilters({ ...DEFAULT_FILTERS, sort: filters.sort, dir: filters.dir })}>
            <X className="size-3.5" /> Clear
          </Button>
        )}
        <span className="ml-auto flex items-center gap-2">
          {active && <span className="text-xs text-muted-foreground tabular-nums">{resultCount} match{resultCount === 1 ? "" : "es"}</span>}
          <SavedFilters filters={filters} onApply={setFilters} />
        </span>
      </div>
    </div>
  );
}
