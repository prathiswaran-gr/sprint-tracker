import { PublicSheetView } from "@/components/explore/public-sheet";

export default async function PublicSheetPage({ params }: PageProps<"/app/sheets/[id]">) {
  const { id } = await params;
  return <PublicSheetView id={id} />;
}
