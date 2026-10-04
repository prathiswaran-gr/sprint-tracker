import { GroupView } from "@/components/groups/group-view";

export default async function GroupPage({ params }: PageProps<"/app/groups/[id]">) {
  const { id } = await params;
  return <GroupView id={id} />;
}
