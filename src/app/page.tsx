import { BarChart3, CalendarClock, Building2, FileSpreadsheet, NotebookPen, Star } from "lucide-react";
import { Suspense } from "react";
import { GoogleSignIn } from "@/components/google-sign-in";
import { Logo } from "@/components/logo";
import { ThemeButton } from "@/components/theme-picker";

const FEATURES = [
  { icon: FileSpreadsheet, title: "Drop in your sheet", body: "Upload any .xlsx prep sheet. Columns are detected automatically — fix the mapping in one click." },
  { icon: CalendarClock, title: "Stay on schedule", body: "Map plan days to real dates, skip weekends, and slide the whole plan forward when life happens." },
  { icon: Building2, title: "Filter by company", body: "Focus on Google, Amazon or Zoho questions. Combine with topic, difficulty and status." },
  { icon: NotebookPen, title: "Notes with code", body: "Markdown notes with syntax-highlighted snippets for every problem. Autosaved." },
  { icon: Star, title: "Revisit list", body: "Star tricky problems and come back to them in a dedicated revision view." },
  { icon: BarChart3, title: "See your progress", body: "Streaks, a completion heatmap and breakdowns by topic, difficulty and company." },
];

export default async function Landing({ searchParams }: PageProps<"/">) {
  const { error } = await searchParams;
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="bg-aurora pointer-events-none absolute inset-0" />
      <div className="bg-grid pointer-events-none absolute inset-0" />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <ThemeButton side="bottom" />
      </header>

      <section className="relative mx-auto max-w-3xl px-6 pt-16 pb-20 text-center sm:pt-24">
        <span className="inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          <span className="size-1.5 rounded-full bg-basic" /> Your prep sheet, supercharged
        </span>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
          Turn your DSA sheet into a{" "}
          <span className="bg-gradient-to-r from-primary via-chart-5 to-chart-2 bg-clip-text text-transparent">sprint you finish</span>.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-pretty text-muted-foreground sm:text-lg">
          Upload your spreadsheet, tick problems off day by day, take notes, and filter by the companies you&apos;re targeting.
          Progress syncs to your Google account.
        </p>
        <div className="mt-9 flex flex-col items-center gap-3">
          <Suspense>
            <GoogleSignIn />
          </Suspense>
          {error && <p className="text-sm text-destructive">Sign-in didn&apos;t complete. Please try again.</p>}
          <p className="text-xs text-muted-foreground">Free · your sheet stays private to your account</p>
        </div>
      </section>

      <section className="relative mx-auto grid max-w-6xl gap-4 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="group rounded-2xl border bg-card/50 p-5 backdrop-blur transition-colors hover:border-primary/40 hover:bg-card/80">
            <div className="mb-3 inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-4.5" />
            </div>
            <h3 className="font-medium">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
