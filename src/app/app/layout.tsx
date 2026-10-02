import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { supabaseServer } from "@/lib/supabase/server";

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/");
  const meta = data.user.user_metadata ?? {};
  const user = {
    email: data.user.email ?? "",
    name: meta.full_name ?? meta.name ?? data.user.email ?? "You",
    avatar: meta.avatar_url ?? meta.picture ?? null,
    accent: typeof meta.accent === "string" ? meta.accent : null,
  };
  return <AppShell user={user}>{children}</AppShell>;
}
