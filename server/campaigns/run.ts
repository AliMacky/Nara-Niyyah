"use server";

import { after } from "next/server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { campaigns, searches } from "@/lib/db/schema";
import { runSearch } from "@/server/search/run-search";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function runCampaignSearch(
  campaignId: string,
): Promise<{ searchId: string }> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, user.id)))
    .limit(1);

  if (!campaign) throw new Error("Campaign not found");

  const displayTerm = campaign.terms.join(", ");

  const [search] = await db
    .insert(searches)
    .values({
      userId: user.id,
      campaignId: campaign.id,
      term: displayTerm,
      locationScope: campaign.locationScope,
    })
    .returning();

  await db
    .update(campaigns)
    .set({ lastRunAt: new Date(), updatedAt: new Date() })
    .where(eq(campaigns.id, campaignId));

  after(async () => {
    try {
      await runSearch(search.id, campaign.terms);
    } catch (err) {
      console.error(`[campaign] runSearch failed for ${search.id}:`, err);
    }
  });

  revalidatePath(`/campaigns/${campaignId}`);
  return { searchId: search.id };
}
