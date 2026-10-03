import { Copy, Layers, ListChecks, Timer } from "lucide-react";
import Link from "next/link";
import { Tag } from "@/components/sprint/chips";
import { formatDuration } from "@/lib/duration";
import type { PublicSheet } from "@/lib/types";
import { DifficultyBar, MaangCoverage, OwnerLine } from "./sheet-meta";

export function SheetCard({ sheet }: { sheet: PublicSheet }) {
  return (
    <Link
      href={`/app/sheets/${sheet.id}`}
      className="group flex flex-col gap-3.5 rounded-2xl border bg-card/50 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
    >
      <div className="min-w-0">
        <h3 className="truncate font-semibold group-hover:text-primary">{sheet.title}</h3>
        <OwnerLine sheet={sheet} className="mt-1" />
      </div>
      {sheet.description && <p className="line-clamp-2 text-sm text-muted-foreground">{sheet.description}</p>}

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground tabular-nums">
        <span className="flex items-center gap-1"><Timer className="size-3.5" /> {formatDuration(sheet.day_count)}</span>
        <span className="flex items-center gap-1"><ListChecks className="size-3.5" /> {sheet.problem_count} problems</span>
        <span className="flex items-center gap-1"><Layers className="size-3.5" /> {sheet.sprint_count} sprints</span>
      </div>

      <DifficultyBar sheet={sheet} />

      {sheet.topics.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {sheet.topics.slice(0, 5).map((t) => <Tag key={t}>{t}</Tag>)}
          {sheet.topics.length > 5 && <span className="text-[11px] text-muted-foreground">+{sheet.topics.length - 5}</span>}
        </div>
      )}

      <div className="mt-auto flex items-end justify-between gap-3 border-t pt-3">
        <MaangCoverage counts={sheet.company_counts} />
        {sheet.copy_count > 0 && (
          <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground tabular-nums">
            <Copy className="size-3" /> {sheet.copy_count}
          </span>
        )}
      </div>
    </Link>
  );
}
