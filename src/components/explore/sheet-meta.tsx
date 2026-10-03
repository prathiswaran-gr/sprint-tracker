import { summarizeCompanies } from "@/lib/companies";
import type { PublicSheet } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Tag } from "@/components/sprint/chips";

export function OwnerLine({ sheet, className }: { sheet: PublicSheet; className?: string }) {
  if (!sheet.owner_name) return <span className={cn("text-xs text-muted-foreground", className)}>Community sheet</span>;
  return (
    <span className={cn("flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground", className)}>
      {sheet.owner_avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={sheet.owner_avatar} alt="" referrerPolicy="no-referrer" className="size-4 rounded-full" />
      ) : (
        <span className="inline-flex size-4 items-center justify-center rounded-full bg-primary/20 text-[9px] font-medium text-primary">
          {sheet.owner_name.slice(0, 1).toUpperCase()}
        </span>
      )}
      <span className="truncate">by {sheet.owner_name}</span>
    </span>
  );
}

/** Lit chip per MAANG company the sheet covers, dim otherwise. */
export function MaangCoverage({ counts, showCounts = false }: { counts: Record<string, number>; showCounts?: boolean }) {
  const { maang, maangCovered } = summarizeCompanies(counts);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs font-medium tabular-nums">{maangCovered}/5 MAANG</span>
      {maang.map((m) => (
        <span
          key={m.name}
          title={m.covered ? `${m.name}: ${m.count} problems` : `${m.name}: not covered`}
          className={cn(
            "inline-flex h-5 items-center rounded-md px-1.5 text-[11px] ring-1 ring-inset",
            m.covered ? "bg-primary/15 text-primary ring-primary/25" : "text-muted-foreground/50 ring-border line-through",
          )}
        >
          {m.name}
          {showCounts && m.covered && <span className="ml-1 opacity-70 tabular-nums">{m.count}</span>}
        </span>
      ))}
    </div>
  );
}

export function OtherCompanies({ counts, max = 5 }: { counts: Record<string, number>; max?: number }) {
  const { others, total, maangCovered } = summarizeCompanies(counts, max);
  if (!others.length) return null;
  const rest = total - maangCovered - others.length;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {others.map((o) => <Tag key={o.name}>{o.name}</Tag>)}
      {rest > 0 && <span className="text-[11px] text-muted-foreground">+{rest} more</span>}
    </div>
  );
}

export function DifficultyBar({ sheet }: { sheet: PublicSheet }) {
  const parts = [
    { label: "Basic", n: sheet.basic_count, cls: "bg-basic" },
    { label: "Core", n: sheet.core_count, cls: "bg-core" },
    { label: "Pro", n: sheet.pro_count, cls: "bg-pro" },
  ];
  const rated = parts.reduce((s, p) => s + p.n, 0);
  if (!rated) return null;
  return (
    <div className="grid gap-1.5">
      <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full">
        {parts.filter((p) => p.n).map((p) => (
          <span key={p.label} className={p.cls} style={{ width: `${(p.n / rated) * 100}%` }} />
        ))}
      </div>
      <div className="flex gap-3 text-[11px] text-muted-foreground tabular-nums">
        {parts.map((p) => (
          <span key={p.label} className="flex items-center gap-1">
            <span className={cn("size-1.5 rounded-full", p.cls)} /> {p.label} {p.n}
          </span>
        ))}
      </div>
    </div>
  );
}
