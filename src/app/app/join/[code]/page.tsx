import { JoinGroup } from "@/components/groups/join-group";

export default async function JoinPage({ params }: PageProps<"/app/join/[code]">) {
  const { code } = await params;
  return <JoinGroup code={code} />;
}
