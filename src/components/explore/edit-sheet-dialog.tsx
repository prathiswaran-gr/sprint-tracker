"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateSprint } from "@/lib/api";
import type { PublicSheet } from "@/lib/types";

/** Owner-only: rename the public sheet / edit its description (same fields as the sprint's settings). */
export function EditSheetButton({ sheet }: { sheet: PublicSheet }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(sheet.title);
  const [description, setDescription] = useState(sheet.description);

  const save = useMutation({
    mutationFn: () => updateSprint(sheet.id, { title: title.trim(), description: description.trim() }),
    onSuccess: async () => {
      await Promise.all(
        [["public-sheet", sheet.id], ["public-sheets"], ["sprints"], ["sprint", sheet.id]].map((queryKey) => qc.invalidateQueries({ queryKey })),
      );
      toast.success("Sheet updated");
      setOpen(false);
    },
    onError: (e) => toast.error("Couldn't save", { description: e.message }),
  });

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Edit sheet name"
        className="text-muted-foreground"
        onClick={() => {
          setTitle(sheet.title);
          setDescription(sheet.description);
          setOpen(true);
        }}
      >
        <Pencil />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit public sheet</DialogTitle>
            <DialogDescription>Changes show everywhere this sheet appears, including your own sprint.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); if (title.trim()) save.mutate(); }} className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="sheet-title">Name</Label>
              <Input id="sheet-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} autoFocus />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="sheet-desc">Description</Label>
              <Textarea id="sheet-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} className="min-h-20" />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!title.trim() || save.isPending}>
                {save.isPending && <Loader2 className="animate-spin" />} Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
