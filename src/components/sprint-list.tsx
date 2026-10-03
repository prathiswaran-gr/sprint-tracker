"use client";

import { formatDistanceToNow } from "date-fns";
import { Compass, FileSpreadsheet, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressRing } from "@/components/progress-ring";
import { useSprints } from "@/hooks/use-sprints";

export function SprintList() {
  const { data, isLoading } = useSprints();
  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your sprints</h1>
          <p className="mt-1 text-sm text-muted-foreground">Pick up where you left off.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="rounded-lg"><Link href="/app/explore"><Compass /> <span className="max-sm:hidden">Browse public sheets</span></Link></Button>
          <Button asChild className="rounded-lg"><Link href="/app/import"><Plus /> New sprint</Link></Button>
        </div>
      </div>

      {isLoading && <div className="grid gap-4 sm:grid-cols-2">{[0, 1].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>}

      {data?.length === 0 && (
        <Link href="/app/import" className="group flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed px-6 py-20 text-center transition-colors hover:border-primary/50 hover:bg-primary/5">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><FileSpreadsheet className="size-6" /></div>
          <p className="font-medium">Upload your first prep sheet</p>
          <p className="text-sm text-muted-foreground">Drop in an .xlsx and we&apos;ll turn it into a day-by-day sprint — or copy one from Explore.</p>
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {data?.map((s) => {
          const pct = s.total ? s.done / s.total : 0;
          return (
            <Link key={s.id} href={`/app/s/${s.id}`} className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border bg-card/50 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5">
              <div className="relative">
                <ProgressRing value={pct} size={64} stroke={6} />
                <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums">{Math.round(pct * 100)}%</span>
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold">{s.title}</p>
                <p className="text-sm text-muted-foreground tabular-nums">{s.done} / {s.total} problems</p>
                <p className="mt-1 text-xs text-muted-foreground">Created {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
