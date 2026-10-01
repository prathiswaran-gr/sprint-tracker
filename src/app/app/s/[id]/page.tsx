import { Suspense } from "react";
import { SprintView } from "@/components/sprint/sprint-view";

export default async function SprintPage({ params }: PageProps<"/app/s/[id]">) {
  const { id } = await params;
  return (
    <Suspense>
      <SprintView id={id} />
    </Suspense>
  );
}
