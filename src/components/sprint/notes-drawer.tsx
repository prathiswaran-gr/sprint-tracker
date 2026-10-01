"use client";

import { Check, ExternalLink, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { Problem } from "@/lib/types";
import { CompanyTags, DifficultyChip, Tag } from "./chips";
import { Markdown } from "./markdown";

const TEMPLATE = "## Approach\n\n\n## Complexity\n- Time: O()\n- Space: O()\n\n## Code\n```java\n\n```\n";

type Status = "idle" | "saving" | "saved";

function NotesEditor({ problem, onSave }: { problem: Problem; onSave: (notes: string) => Promise<unknown> }) {
  const [value, setValue] = useState(problem.notes);
  const [status, setStatus] = useState<Status>("idle");
  const last = useRef(problem.notes);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const flush = async (v: string) => {
    if (v === last.current) return;
    setStatus("saving");
    try {
      await onSave(v);
      last.current = v;
      setStatus("saved");
    } catch {
      setStatus("idle");
    }
  };

  const latest = useRef(value);
  // Autosave 800ms after typing stops; flush on close/unmount.
  useEffect(() => {
    latest.current = value;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => flush(value), 800);
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => void flush(latest.current), []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const t = e.currentTarget;
    const { selectionStart: s, selectionEnd: end } = t;
    const next = value.slice(0, s) + "  " + value.slice(end);
    setValue(next);
    requestAnimationFrame(() => t.setSelectionRange(s + 2, s + 2));
  };

  return (
    <Tabs defaultValue={problem.notes ? "preview" : "write"} className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center gap-2">
        <TabsList>
          <TabsTrigger value="write">Write</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        {!value && (
          <button onClick={() => setValue(TEMPLATE)} className="text-xs text-primary hover:underline">Use template</button>
        )}
        <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground" aria-live="polite">
          {status === "saving" && <><Loader2 className="size-3 animate-spin" /> Saving…</>}
          {status === "saved" && <><Check className="size-3 text-basic" /> Saved</>}
        </span>
      </div>
      <TabsContent value="write" className="min-h-0 flex-1">
        <Textarea
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={"Approach, edge cases, complexity…\n\nMarkdown supported — use ``` for code blocks."}
          className="h-full min-h-[50vh] resize-none font-mono text-[13px] leading-relaxed"
        />
      </TabsContent>
      <TabsContent value="preview" className="min-h-0 flex-1 overflow-y-auto rounded-lg border bg-muted/20 p-4">
        {value.trim() ? <Markdown>{value}</Markdown> : <p className="text-sm text-muted-foreground">Nothing here yet.</p>}
      </TabsContent>
    </Tabs>
  );
}

export function NotesDrawer({ problem, onClose, onSave }: {
  problem: Problem | null; onClose: () => void; onSave: (p: Problem, notes: string) => Promise<unknown>;
}) {
  return (
    <Sheet open={Boolean(problem)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-xl">
        {problem && (
          <>
            <SheetHeader className="border-b">
              <SheetTitle className="pr-8 text-lg">{problem.name}</SheetTitle>
              <SheetDescription asChild>
                <div className="flex flex-wrap items-center gap-1.5">
                  <DifficultyChip difficulty={problem.difficulty} />
                  <Tag>Day {problem.day_no}</Tag>
                  {problem.topics.map((t) => <Tag key={t}>{t}</Tag>)}
                  {problem.url && (
                    <a href={problem.url} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      Open problem <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              </SheetDescription>
              {problem.companies.length > 0 && <CompanyTags companies={problem.companies} max={8} />}
            </SheetHeader>
            <div className="flex min-h-0 flex-1 flex-col p-4">
              <NotesEditor key={problem.id} problem={problem} onSave={(n) => onSave(problem, n)} />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
