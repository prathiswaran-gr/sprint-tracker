"use client";

import { format, parseISO } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Problem } from "@/lib/types";

export function MoveDialog({ problem, onClose, onMove, dateFor, currentDay }: {
  problem: Problem | null; onClose: () => void; onMove: (p: Problem, day: number) => void;
  dateFor: (d: number) => string | null; currentDay: number | null;
}) {
  return (
    <Dialog open={Boolean(problem)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        {problem && <MoveForm key={problem.id} problem={problem} onClose={onClose} onMove={onMove} dateFor={dateFor} currentDay={currentDay} />}
      </DialogContent>
    </Dialog>
  );
}

function MoveForm({ problem, onClose, onMove, dateFor, currentDay }: {
  problem: Problem; onClose: () => void; onMove: (p: Problem, day: number) => void;
  dateFor: (d: number) => string | null; currentDay: number | null;
}) {
  const [day, setDay] = useState(String(problem.day_no));
  const n = Number.parseInt(day, 10);
  const valid = Number.isFinite(n) && n >= 1 && n <= 2000;
  const date = valid ? dateFor(n) : null;
  const submit = () => {
    if (!valid) return;
    onMove(problem, n);
    onClose();
  };
  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>Move to day</DialogTitle>
        <DialogDescription className="truncate">{problem.name}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-2">
        <Label htmlFor="move-day">Plan day</Label>
        <Input id="move-day" type="number" min={1} autoFocus value={day} onChange={(e) => setDay(e.target.value)} />
        <p className="text-xs text-muted-foreground">{date ? format(parseISO(date), "EEEE, MMM d, yyyy") : "Set a start date to see calendar dates."}</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {currentDay != null && <Button type="button" variant="outline" size="xs" onClick={() => setDay(String(currentDay))}>Today</Button>}
        {currentDay != null && <Button type="button" variant="outline" size="xs" onClick={() => setDay(String(currentDay + 1))}>Tomorrow</Button>}
        <Button type="button" variant="outline" size="xs" onClick={() => setDay(String(problem.day_no + 1))}>+1 day</Button>
        <Button type="button" variant="outline" size="xs" onClick={() => setDay(String(problem.day_no + 7))}>+1 week</Button>
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={!valid}>Move</Button>
      </DialogFooter>
    </form>
  );
}
