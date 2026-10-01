"use client";

import { format, parseISO } from "date-fns";
import { CalendarIcon, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { deleteSprint, type SprintPatch } from "@/lib/api";
import type { Sprint } from "@/lib/types";

const iso = (d: Date) => format(d, "yyyy-MM-dd");

export function SettingsDialog({ sprint, open, onOpenChange, onSave }: {
  sprint: Sprint; open: boolean; onOpenChange: (o: boolean) => void; onSave: (p: SprintPatch) => Promise<unknown>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        {open && <SettingsForm sprint={sprint} onDone={() => onOpenChange(false)} onSave={onSave} />}
      </DialogContent>
    </Dialog>
  );
}

function SettingsForm({ sprint, onDone, onSave }: { sprint: Sprint; onDone: () => void; onSave: (p: SprintPatch) => Promise<unknown> }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [title, setTitle] = useState(sprint.title);
  const [start, setStart] = useState<string | null>(sprint.start_date);
  const [skipWeekends, setSkipWeekends] = useState(sprint.skip_weekends);
  const [rest, setRest] = useState<string[]>(sprint.rest_days);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await onSave({ title: title.trim() || sprint.title, start_date: start, skip_weekends: skipWeekends, rest_days: [...rest].sort() });
      toast.success("Sprint updated");
      onDone();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await deleteSprint(sprint.id);
      await qc.invalidateQueries({ queryKey: ["sprints"] });
      toast.success("Sprint deleted");
      router.push("/app");
    } catch (e) {
      toast.error("Couldn't delete", { description: (e as Error).message });
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5">
      <DialogHeader>
        <DialogTitle>Sprint settings</DialogTitle>
        <DialogDescription>Map plan days onto your calendar.</DialogDescription>
      </DialogHeader>

      <div className="grid gap-2">
        <Label htmlFor="sprint-title">Name</Label>
        <Input id="sprint-title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="grid gap-2">
        <Label>Start date (Day 1)</Label>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex-1 justify-start gap-2 font-normal">
                <CalendarIcon className="size-4 opacity-60" />
                {start ? format(parseISO(start), "PPP") : <span className="text-muted-foreground">Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={start ? parseISO(start) : undefined} onSelect={(d) => setStart(d ? iso(d) : null)} />
            </PopoverContent>
          </Popover>
          <Button variant="outline" onClick={() => setStart(iso(new Date()))}>Today</Button>
        </div>
      </div>

      <label className="flex items-center justify-between gap-4 rounded-lg border p-3">
        <span>
          <span className="block text-sm font-medium">Skip weekends</span>
          <span className="block text-xs text-muted-foreground">Saturdays and Sundays aren&apos;t plan days.</span>
        </span>
        <Switch checked={skipWeekends} onCheckedChange={setSkipWeekends} />
      </label>

      <div className="grid gap-2">
        <Label>Rest days</Label>
        <p className="text-xs text-muted-foreground">Pick days off — the plan skips them.</p>
        <div className="flex justify-center rounded-lg border">
          <Calendar
            mode="multiple"
            selected={rest.map((d) => parseISO(d))}
            onSelect={(ds) => setRest((ds ?? []).map(iso))}
            defaultMonth={start ? parseISO(start) : undefined}
          />
        </div>
        {rest.length > 0 && (
          <button onClick={() => setRest([])} className="justify-self-start text-xs text-muted-foreground hover:text-foreground">
            Clear {rest.length} rest day{rest.length > 1 ? "s" : ""}
          </button>
        )}
      </div>

      <DialogFooter className="flex-row items-center sm:justify-between">
        {confirmDelete ? (
          <Button variant="destructive" onClick={remove} disabled={busy}>Delete forever?</Button>
        ) : (
          <Button variant="ghost" className="text-destructive" onClick={() => setConfirmDelete(true)}>
            <Trash2 /> Delete
          </Button>
        )}
        <Button onClick={save} disabled={busy} className="ml-auto">Save</Button>
      </DialogFooter>
    </div>
  );
}
