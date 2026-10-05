"use client";

import { format } from "date-fns";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { dayLabel, solvedText, type ActivityItem } from "@/lib/activity";
import type { GroupMember } from "@/lib/types";
import { AvatarStack, MemberAvatar } from "./member-avatar";

/** What teammates solved this week, one line per member per day, with a 👏 for others' days. */
export function ActivityFeed({ items, members, me, onClap }: {
  items: ActivityItem[]; members: GroupMember[]; me?: string; onClap: (item: ActivityItem) => void;
}) {
  const byId = useMemo(() => new Map(members.map((m) => [m.user_id, m])), [members]);
  const today = format(new Date(), "yyyy-MM-dd");
  const rows = items.flatMap((item) => {
    const member = byId.get(item.user_id);
    return member ? [{ item, member }] : [];
  });

  return (
    <section aria-label="Activity" className="overflow-hidden rounded-2xl border bg-card/40">
      <h2 className="border-b px-5 py-3 text-sm font-semibold">Activity</h2>
      {rows.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">Nothing solved this week yet. Be the first!</p>
      ) : (
        <div>
          {rows.map(({ item, member }) => {
            const isMe = member.user_id === me;
            const clappers = item.claps.flatMap((id) => byId.get(id) ?? []);
            return (
              <div key={item.key} className="flex items-center gap-3 border-b px-5 py-3 last:border-b-0">
                <MemberAvatar member={member} className="size-8" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{member.display_name}</span>
                    {isMe && <span className="text-xs text-muted-foreground"> (you)</span>}{" "}
                    <span className="text-muted-foreground">{solvedText(item.count, dayLabel(item.day, today))}</span>
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.names.join(", ")}
                    {item.more > 0 && ` +${item.more} more`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {clappers.length > 0 && (
                    <span title={`👏 from ${clappers.map((c) => c.display_name).join(", ")}`}>
                      <AvatarStack members={clappers} max={3} size="size-5" ringFor={me} />
                    </span>
                  )}
                  {isMe ? (
                    item.claps.length > 0 && <span className="text-xs text-muted-foreground tabular-nums">👏 {item.claps.length}</span>
                  ) : (
                    <Button
                      variant={item.clappedByMe ? "secondary" : "ghost"}
                      size="sm"
                      aria-label={`Clap for ${member.display_name}`}
                      aria-pressed={item.clappedByMe}
                      onClick={() => onClap(item)}
                    >
                      <span aria-hidden>👏</span>
                      {item.claps.length > 0 && <span className="tabular-nums">{item.claps.length}</span>}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
