"use client";

import { LogOut } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  accent: string | null;
}

export function Avatar({ user, className = "size-7" }: { user: SessionUser; className?: string }) {
  return user.avatar ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={user.avatar} alt="" referrerPolicy="no-referrer" className={`${className} rounded-full`} />
  ) : (
    <span className={`${className} inline-flex items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary`}>
      {user.name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function UserMenu({ user, compact }: { user: SessionUser; compact?: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left text-sm outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar user={user} />
        {!compact && (
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{user.name}</span>
            <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-56">
        <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <form action="/auth/signout" method="post">
          <DropdownMenuItem asChild variant="destructive">
            <button type="submit" className="w-full"><LogOut /> Sign out</button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
