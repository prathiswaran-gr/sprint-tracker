import type { Difficulty } from "@/lib/types";
import { cn } from "@/lib/utils";

const DIFF_STYLE: Record<Difficulty, string> = {
  Basic: "text-basic bg-basic/10 ring-basic/25",
  Core: "text-core bg-core/10 ring-core/25",
  Pro: "text-pro bg-pro/10 ring-pro/25",
};
const DOT: Record<Difficulty, string> = { Basic: "bg-basic", Core: "bg-core", Pro: "bg-pro" };

export function DifficultyChip({ difficulty, className }: { difficulty: Difficulty | null; className?: string }) {
  if (!difficulty) return null;
  return (
    <span className={cn("inline-flex h-5 items-center rounded-md px-1.5 text-[11px] font-medium ring-1 ring-inset", DIFF_STYLE[difficulty], className)}>
      {difficulty}
    </span>
  );
}

export function DifficultyDot({ difficulty }: { difficulty: Difficulty | null }) {
  return <span className={cn("size-2 shrink-0 rounded-full", difficulty ? DOT[difficulty] : "bg-muted-foreground/40")} />;
}

export function Tag({ children, className, active }: { children: React.ReactNode; className?: string; active?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 max-w-40 items-center truncate rounded-md bg-muted px-1.5 text-[11px] text-muted-foreground",
        active && "bg-primary/15 text-primary",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** First few companies, highlighting any that are currently filtered on. */
export function CompanyTags({ companies, highlight = [], max = 3 }: { companies: string[]; highlight?: string[]; max?: number }) {
  if (!companies.length) return null;
  const sorted = [...companies].sort((a, b) => Number(highlight.includes(b)) - Number(highlight.includes(a)));
  const shown = sorted.slice(0, max);
  return (
    <span className="flex min-w-0 items-center gap-1" title={companies.join(", ")}>
      {shown.map((c) => (
        <Tag key={c} active={highlight.includes(c)}>{c}</Tag>
      ))}
      {companies.length > max && <span className="text-[11px] text-muted-foreground">+{companies.length - max}</span>}
    </span>
  );
}

export function SubjectTag({ subject }: { subject: string }) {
  if (!subject || subject === "dsa") return null;
  return <Tag className="bg-chart-5/10 text-chart-5 uppercase">{subject}</Tag>;
}
