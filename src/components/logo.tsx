import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span className="relative inline-flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-chart-5 text-primary-foreground shadow-md shadow-primary/30">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 17l5-5 4 4 7-8" />
        </svg>
      </span>
      Sprintboard
    </Link>
  );
}
