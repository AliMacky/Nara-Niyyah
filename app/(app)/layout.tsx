import { redirect } from "next/navigation";
import { AppShell } from "@/components/nara/app-shell";
import { createSupabaseServer } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AppShell
      contextLabel={user.email ?? "Nara"}
    >
      {children}
    </AppShell>
  );
}
