"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { campaigns } from "@/lib/db/schema";
import { createSupabaseServer } from "@/lib/supabase/server";

const CreateCampaignSchema = z.object({
  name: z.string().min(1).max(100),
  terms: z.array(z.string().min(1).max(200)).min(1).max(10),
  locationScope: z.string().max(100).optional(),
  scheduleInterval: z.enum(["daily", "every_3_days", "weekly", "biweekly"]),
});

export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>;

export async function createCampaign(
  input: CreateCampaignInput,
): Promise<{ campaignId: string }> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const validated = CreateCampaignSchema.parse(input);

  const [campaign] = await db
    .insert(campaigns)
    .values({
      userId: user.id,
      name: validated.name,
      terms: validated.terms,
      locationScope: validated.locationScope ?? null,
      scheduleInterval: validated.scheduleInterval,
    })
    .returning({ id: campaigns.id });

  revalidatePath("/campaigns");
  return { campaignId: campaign.id };
}

export async function pauseCampaign(campaignId: string): Promise<void> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  await db
    .update(campaigns)
    .set({ status: "paused", updatedAt: new Date() })
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, user.id)));

  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${campaignId}`);
}

export async function resumeCampaign(campaignId: string): Promise<void> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  await db
    .update(campaigns)
    .set({ status: "active", updatedAt: new Date() })
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, user.id)));

  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${campaignId}`);
}

export async function archiveCampaign(campaignId: string): Promise<void> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  await db
    .update(campaigns)
    .set({ status: "archived", updatedAt: new Date() })
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, user.id)));

  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${campaignId}`);
}
