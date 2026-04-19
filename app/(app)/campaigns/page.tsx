import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getCampaigns } from "@/server/campaigns/queries";
import CampaignsClient from "./_components/campaigns-client";

export default async function CampaignsPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const campaigns = await getCampaigns(user.id);

  return <CampaignsClient campaigns={campaigns} />;
}
