import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import DashboardClient from "./_components/dashboard-client";

export default async function DashboardPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <DashboardClient initialSearch={null} />;
}
