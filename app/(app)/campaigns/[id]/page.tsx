import { redirect, notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import {
  getCampaignDetail,
  getCampaignRuns,
} from "@/server/campaigns/queries";
import CampaignDetailClient from "./_components/campaign-detail-client";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const campaign = await getCampaignDetail(id, user.id);
  if (!campaign) notFound();

  const runs = await getCampaignRuns(id);

  return (
    <CampaignDetailClient
      campaign={campaign}
      runs={runs}
    />
  );
}
