"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, Loader2, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessionUser } from "@/components/shell/session-user";
import { groupPreview, joinGroup } from "@/lib/api";
import { formatDuration } from "@/lib/duration";

export function JoinGroup({ code }: { code: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const user = useSessionUser();
  const { data: preview, isLoading } = useQuery({ queryKey: ["group-preview", code], queryFn: () => groupPreview(code) });

  const join = useMutation({
    mutationFn: (existing?: string) => joinGroup(code, { name: user?.name ?? "Member", avatar: user?.avatar ?? null }, existing),
    onSuccess: async (sprintId) => {
      await Promise.all([qc.invalidateQueries({ queryKey: ["groups"] }), qc.invalidateQueries({ queryKey: ["sprints"] })]);
      toast.success(`Joined ${preview?.name ?? "the group"}`, { description: "Your progress is now visible to the group." });
      router.push(`/app/s/${sprintId}`);
    },
    onError: (e) => toast.error("Couldn't join", { description: e.message }),
  });

  if (isLoading) {
    return <div className="mx-auto max-w-md p-8"><Skeleton className="h-64 rounded-3xl" /></div>;
  }
  if (!preview) {
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        <p className="font-medium">This invite link isn&apos;t valid</p>
        <p className="mt-1 text-sm text-muted-foreground">The group may have been deleted. Ask for a new link.</p>
        <Button asChild variant="outline" className="mt-4"><Link href="/app">Back to your sprints</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md p-4 sm:p-8">
      <div className="rounded-3xl border bg-gradient-to-br from-primary/15 via-card/60 to-card/30 p-6 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary"><Users className="size-6" /></div>
        <p className="text-sm text-muted-foreground">{preview.owner_name ?? "Someone"} invited you to</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{preview.name}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {preview.sheet_title} · {preview.problem_count} problems · {formatDuration(preview.day_count)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{preview.member_count} member{preview.member_count === 1 ? "" : "s"}</p>

        <div className="mt-6 grid gap-2">
          {preview.my_sprint_id ? (
            <>
              <Button asChild size="lg"><Link href={`/app/groups/${preview.id}`}>Open group</Link></Button>
              <Button asChild variant="ghost"><Link href={`/app/s/${preview.my_sprint_id}`}>Open your sprint</Link></Button>
            </>
          ) : (
            <>
              {preview.existing_copy_id && (
                <Button size="lg" onClick={() => join.mutate(preview.existing_copy_id!)} disabled={join.isPending}>
                  {join.isPending ? <Loader2 className="animate-spin" /> : <Link2 />} Join with my existing copy
                </Button>
              )}
              <Button
                size="lg"
                variant={preview.existing_copy_id ? "outline" : "default"}
                onClick={() => join.mutate(undefined)}
                disabled={join.isPending}
              >
                {join.isPending && !preview.existing_copy_id && <Loader2 className="animate-spin" />}
                {preview.existing_copy_id ? "Join with a fresh copy" : "Join group"}
              </Button>
            </>
          )}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Members see which problems you&apos;ve completed. Your notes and stars stay private.
        </p>
      </div>
    </div>
  );
}
