import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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

export function AvatarStack({ members, max = 4, size = "size-5" }: { members: Pick<GroupMember, "user_id" | "display_name" | "avatar">[]; max?: number; size?: string }) {
  const shown = members.slice(0, max);
  return (
    <span className="flex items-center -space-x-1.5">
      {shown.map((m) => <MemberAvatar key={m.user_id} member={m} className={cn(size, "ring-2 ring-background")} />)}
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

/** "Who else finished this" badge on a problem. */
export function PeersBadge({ peers }: { peers: Peer[] }) {
  if (!peers.length) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-muted/60 py-0.5 pr-1.5 pl-0.5" aria-label={`Completed by ${peers.map((p) => p.member.display_name).join(", ")}`}>
          <AvatarStack members={peers.map((p) => p.member)} max={3} size="size-4" />
          <span className="text-[10px] text-muted-foreground tabular-nums">{peers.length}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <div className="grid gap-0.5">
          {peers.map((p) => (
            <span key={p.member.user_id}>✓ {p.member.display_name} · {format(new Date(p.doneAt), "MMM d")}</span>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
