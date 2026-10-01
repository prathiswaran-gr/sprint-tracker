"use client";

import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { AlertTriangle, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DifficultyChip, Tag } from "@/components/sprint/chips";
import { createSprint } from "@/lib/api";
import { detectMapping, FIELD_LABELS, FIELDS, toProblems, type ColumnMapping, type Field } from "@/lib/xlsx/mapColumns";
import { parseWorkbook, type ParsedWorkbook } from "@/lib/xlsx/parse";
import { cn } from "@/lib/utils";

const NONE = "__none__";

export function ImportWizard() {
  const router = useRouter();
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [fileName, setFileName] = useState("");
  const [wb, setWb] = useState<ParsedWorkbook | null>(null);
  const [sheetIdx, setSheetIdx] = useState(0);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [skipWeekends, setSkipWeekends] = useState(false);
  const [creating, setCreating] = useState(false);

  const sheet = wb?.sheets[sheetIdx];

  async function load(file: File) {
    try {
      const parsed = parseWorkbook(await file.arrayBuffer());
      const usable = parsed.sheets.filter((s) => s.rows.length);
      if (!usable.length) throw new Error("No rows found in this file.");
      const best = parsed.sheets.indexOf(usable.reduce((a, b) => (b.rows.length > a.rows.length ? b : a)));
      setWb(parsed);
      setSheetIdx(best);
      setMapping(detectMapping(parsed.sheets[best].headers));
      setFileName(file.name);
      setTitle(file.name.replace(/\.(xlsx|xls|csv)$/i, ""));
    } catch (e) {
      toast.error("Couldn't read that file", { description: (e as Error).message });
    }
  }

  const result = useMemo(() => {
    if (!sheet) return null;
    try {
      return { ...toProblems(sheet, mapping), error: null };
    } catch (e) {
      return { problems: [], warnings: [], error: (e as Error).message };
    }
  }, [sheet, mapping]);

  const summary = useMemo(() => {
    const ps = result?.problems ?? [];
    return {
      count: ps.length,
      days: new Set(ps.map((p) => p.day_no)).size,
      sprints: new Set(ps.map((p) => p.sprint_no)).size,
      companies: new Set(ps.flatMap((p) => p.companies)).size,
    };
  }, [result]);

  async function create() {
    if (!result?.problems.length) return;
    setCreating(true);
    try {
      const s = await createSprint({ title: title.trim() || "My sprint", start_date: startDate || null, skip_weekends: skipWeekends }, result.problems);
      await qc.invalidateQueries({ queryKey: ["sprints"] });
      toast.success(`Imported ${result.problems.length} problems`);
      router.push(`/app/s/${s.id}`);
    } catch (e) {
      toast.error("Import failed", { description: (e as Error).message });
      setCreating(false);
    }
  }

  if (!wb || !sheet) {
    return (
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) load(f); }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed bg-card/30 px-6 py-20 text-center transition-colors hover:border-primary/50 hover:bg-primary/5",
          drag && "border-primary bg-primary/10",
        )}
      >
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Upload className="size-6" />
        </div>
        <div>
          <p className="font-medium">Drop your .xlsx here, or click to browse</p>
          <p className="mt-1 text-sm text-muted-foreground">Expected columns: Name, Url, Subject, Difficulty, Companies, Topics, Sprint, Day</p>
        </div>
        <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) load(f); e.target.value = ""; }} />
      </div>
    );
  }

  const setField = (f: Field, v: string) => setMapping((m) => ({ ...m, [f]: v === NONE ? undefined : Number(v) }));

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card/40 px-4 py-3">
        <FileSpreadsheet className="size-5 text-basic" />
        <span className="font-medium">{fileName}</span>
        {wb.sheets.length > 1 && (
          <Select value={String(sheetIdx)} onValueChange={(v) => { const i = Number(v); setSheetIdx(i); setMapping(detectMapping(wb.sheets[i].headers)); }}>
            <SelectTrigger size="sm" className="w-auto"><SelectValue /></SelectTrigger>
            <SelectContent>
              {wb.sheets.map((s, i) => <SelectItem key={i} value={String(i)}>{s.name} ({s.rows.length} rows)</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setWb(null)}>Choose another file</Button>
      </div>

      <section className="grid gap-3">
        <h2 className="font-semibold">1. Check column mapping</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {FIELDS.map((f) => (
            <div key={f} className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">{FIELD_LABELS[f]}{f === "name" && " *"}</Label>
              <Select value={mapping[f] == null ? NONE : String(mapping[f])} onValueChange={(v) => setField(f, v)}>
                <SelectTrigger className={cn("w-full", mapping[f] == null && "text-muted-foreground")}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>— none —</SelectItem>
                  {sheet.headers.map((h, i) => <SelectItem key={i} value={String(i)}>{h || `Column ${i + 1}`}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
        {result?.error && <p className="text-sm text-destructive">{result.error}</p>}
        {result?.warnings.map((w) => (
          <p key={w} className="flex items-center gap-2 text-sm text-core"><AlertTriangle className="size-4" /> {w}</p>
        ))}
      </section>

      {result && result.problems.length > 0 && (
        <section className="grid gap-3">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 className="font-semibold">2. Preview</h2>
            <span className="text-sm text-muted-foreground tabular-nums">
              {summary.count} problems · {summary.sprints} sprints · {summary.days} days · {summary.companies} companies
            </span>
          </div>
          <div className="overflow-x-auto rounded-2xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Level</th>
                  <th className="px-3 py-2 font-medium">Topics</th>
                  <th className="px-3 py-2 font-medium">Companies</th>
                  <th className="px-3 py-2 text-right font-medium">Sprint</th>
                  <th className="px-3 py-2 text-right font-medium">Day</th>
                </tr>
              </thead>
              <tbody>
                {result.problems.slice(0, 8).map((p) => (
                  <tr key={p.position} className="border-t">
                    <td className="max-w-64 truncate px-3 py-2">
                      {p.name}
                      {!p.url && <span className="ml-2 text-xs text-core">no link</span>}
                    </td>
                    <td className="px-3 py-2"><DifficultyChip difficulty={p.difficulty} /></td>
                    <td className="px-3 py-2"><span className="flex gap-1">{p.topics.slice(0, 2).map((t) => <Tag key={t}>{t}</Tag>)}</span></td>
                    <td className="px-3 py-2 text-xs text-muted-foreground tabular-nums">{p.companies.length || "—"}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{p.sprint_no}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{p.day_no}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="grid gap-4">
        <h2 className="font-semibold">3. Name &amp; schedule</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="title">Sprint name</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="start">Start date (Day 1)</Label>
            <Input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
        </div>
        <label className="flex items-center justify-between gap-4 rounded-lg border p-3 sm:max-w-md">
          <span className="text-sm">Skip weekends</span>
          <Switch checked={skipWeekends} onCheckedChange={setSkipWeekends} />
        </label>
      </section>

      <div className="flex justify-end">
        <Button size="lg" onClick={create} disabled={creating || !result?.problems.length} className="rounded-xl px-6">
          {creating && <Loader2 className="animate-spin" />}
          Create sprint with {summary.count} problems
        </Button>
      </div>
    </div>
  );
}
