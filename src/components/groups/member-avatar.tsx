"use client";

import { format } from "date-fns";
import { useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { GroupMember } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MemberAvatar({ member, className = "size-6" }: { member: Pick<GroupMember, "display_name" | "avatar">; className?: string }) {
  return member.avatar ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={member.avatar} alt="" referrerPolicy="no-referrer" className={cn("shrink-0 rounded-full object-cover", className)} />
  ) : (
    <span className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-medium text-primary", className)}>
      {member.display_name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function AvatarStack({ members, max = 4, size = "size-5", ringFor }: {
  members: Pick<GroupMember, "user_id" | "display_name" | "avatar">[]; max?: number; size?: string; ringFor?: string;
}) {
  const shown = members.slice(0, max);
  return (
    <span className="flex items-center -space-x-1.5">
      {shown.map((m) => (
        <MemberAvatar key={m.user_id} member={m} className={cn(size, "ring-2", m.user_id === ringFor ? "ring-primary" : "ring-background")} />
      ))}
      {members.length > max && (
        <span className={cn(size, "inline-flex items-center justify-center rounded-full bg-muted text-[9px] font-medium ring-2 ring-background")}>
          +{members.length - max}
        </span>
      )}
    </span>
  );
}

export interface Peer {
  member: GroupMember;
  doneAt: string;
}

/**
 * Overlapping avatars of who completed something. Hover (or tap) opens a scrollable list with names and dates,
 * plus who hasn't done it yet when `pending` is given.
 */
export function PeopleStack({ done, pending, me, size = "size-5", max = 4 }: {
  done: Peer[]; pending?: GroupMember[]; me?: string; size?: string; max?: number;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = () => {
    clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hide = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };
  if (!done.length && !pending?.length) return null;
  const total = done.length + (pending?.length ?? 0);
  const label = done.length ? `Completed by ${done.map((p) => p.member.display_name).join(", ")}` : "Not completed yet";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onMouseEnter={show}
          onMouseLeave={hide}
          className="flex shrink-0 items-center gap-1 rounded-full py-0.5 pr-1.5 pl-0.5 transition-colors hover:bg-muted/60"
        >
          {done.length > 0 ? (
            <AvatarStack members={done.map((p) => p.member)} max={max} size={size} ringFor={me} />
          ) : (
            <span className="px-1 text-xs text-muted-foreground/60">—</span>
          )}
          <span className="text-[10px] text-muted-foreground tabular-nums">{pending ? `${done.length}/${total}` : done.length}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-60 p-0"
        onMouseEnter={show}
        onMouseLeave={hide}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="max-h-64 overflow-y-auto p-1.5">
          {done.length > 0 && (
            <p className="px-2 pt-1 pb-1.5 text-xs font-medium text-muted-foreground">
              Completed by {done.length}{pending ? ` of ${total}` : ""}
            </p>
          )}
          {done.map((p) => (
            <div key={p.member.user_id} className="flex items-center gap-2 rounded-md px-2 py-1.5">
              <MemberAvatar member={p.member} className="size-6" />
              <span className="min-w-0 flex-1 truncate text-sm">
                {p.member.display_name}
                {p.member.user_id === me && <span className="text-muted-foreground"> (you)</span>}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">{format(new Date(p.doneAt), "MMM d")}</span>
            </div>
          ))}
          {pending && pending.length > 0 && (
            <>
              <p className="px-2 pt-2 pb-1.5 text-xs font-medium text-muted-foreground">Not yet</p>
              {pending.map((m) => (
                <div key={m.user_id} className="flex items-center gap-2 rounded-md px-2 py-1.5 opacity-60">
                  <MemberAvatar member={m} className="size-6 grayscale" />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {m.display_name}
                    {m.user_id === me && <span className="text-muted-foreground"> (you)</span>}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** "Who else finished this" badge on a problem. */
export function PeersBadge({ peers }: { peers: Peer[] }) {
  if (!peers.length) return null;
  return <PeopleStack done={peers} size="size-4" max={3} />;
}
