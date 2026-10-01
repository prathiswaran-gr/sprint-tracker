import { ImportWizard } from "@/components/import/import-wizard";

export default function ImportPage() {
  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">New sprint</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">Your file is parsed in the browser — only the problem rows are saved.</p>
      <ImportWizard />
    </div>
  );
}
