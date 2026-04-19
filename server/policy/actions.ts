"use server";

/**
 * server/policy/actions.ts
 *
 * Write-side server actions for the policy platform. These are "use server"
 * functions intended to be called from Client Components (forms, vote buttons,
 * comment boxes).
 *
 * PRIVACY CONTRACT: The authenticated user's Supabase ID is used for auth
 * checks and vote deduplication, but is NEVER written alongside draft or
 * comment content. anonymous_id ("citizen-XXXX") is generated at write time
 * and is the only identity persisted with citizen-authored content.
 */

import { randomInt } from "crypto";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { policyComments, policyDrafts, policyVotes } from "@/lib/db/schema";
import { createSupabaseServer } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Anonymization
// ---------------------------------------------------------------------------

/**
 * Generates a display-safe anonymous citizen ID at write time.
 * Uses Node's crypto.randomInt so the range is uniformly distributed.
 * The result is decorative — it is not a secret, not unique by guarantee,
 * and must never be used to re-identify the author.
 */
function generateAnonymousId(): string {
  return `citizen-${randomInt(1000, 9999)}`;
}

// ---------------------------------------------------------------------------
// submitPolicyDraft
// ---------------------------------------------------------------------------

const SubmitDraftSchema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().min(1).max(500),
  body: z.string().min(1),
  regionLabel: z.string().min(1),
  category: z.enum([
    "housing",
    "transit",
    "environment",
    "education",
    "public-safety",
    "healthcare",
    "economic-development",
    "civil-rights",
  ]),
  aiAssisted: z.boolean().default(false),
});

export type SubmitDraftInput = z.infer<typeof SubmitDraftSchema>;

/**
 * Submits a new policy draft. The author's identity is stripped immediately:
 * only a generated anonymous_id is stored alongside the content.
 */
export async function submitPolicyDraft(
  input: SubmitDraftInput,
): Promise<{ draftId: string }> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const validated = SubmitDraftSchema.parse(input);

  const [draft] = await db
    .insert(policyDrafts)
    .values({
      // user.id is intentionally not stored here — anonymization at write time
      anonymousId: generateAnonymousId(),
      regionLabel: validated.regionLabel,
      title: validated.title,
      summary: validated.summary,
      body: validated.body,
      category: validated.category,
      aiAssisted: validated.aiAssisted,
    })
    .returning({ id: policyDrafts.id });

  revalidatePath("/policy");
  return { draftId: draft.id };
}

// ---------------------------------------------------------------------------
// voteOnDraft
// ---------------------------------------------------------------------------

/**
 * Casts or changes a vote on a policy draft.
 *
 * - First vote: inserts a vote row and adjusts vote_count by `value`.
 * - Changed vote: updates the existing row and adjusts vote_count by the delta.
 * - Repeated same vote: no-op (idempotent).
 *
 * vote_count is updated inside the same transaction so it is always consistent
 * with the policy_votes table.
 */
export async function voteOnDraft(
  draftId: string,
  value: 1 | -1,
): Promise<void> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  await db.transaction(async (tx) => {
    const results = await tx
      .select({ id: policyVotes.id, value: policyVotes.value })
      .from(policyVotes)
      .where(
        and(
          eq(policyVotes.draftId, draftId),
          eq(policyVotes.voterId, user.id),
        ),
      );

    const existing = results[0];

    if (!existing) {
      // First vote from this user on this draft
      await tx.insert(policyVotes).values({
        draftId,
        voterId: user.id,
        value,
      });
      await tx
        .update(policyDrafts)
        .set({ voteCount: sql`${policyDrafts.voteCount} + ${value}` })
        .where(eq(policyDrafts.id, draftId));
    } else if (existing.value !== value) {
      // User is flipping their vote — apply the signed delta
      const delta = value - existing.value;
      await tx
        .update(policyVotes)
        .set({ value })
        .where(eq(policyVotes.id, existing.id));
      await tx
        .update(policyDrafts)
        .set({ voteCount: sql`${policyDrafts.voteCount} + ${delta}` })
        .where(eq(policyDrafts.id, draftId));
    }
    // Same vote repeated — no-op, no db writes needed
  });

  revalidatePath(`/policy/${draftId}`);
}

// ---------------------------------------------------------------------------
// submitComment
// ---------------------------------------------------------------------------

const SubmitCommentSchema = z.object({
  text: z.string().min(1).max(2000),
  regionLabel: z.string().min(1),
});

export type SubmitCommentInput = z.infer<typeof SubmitCommentSchema>;

/**
 * Submits a comment on a policy draft.
 *
 * comment_count on the draft is incremented in the same transaction.
 *
 * NOTE: isPolitician is always false here. The politician identity flow is
 * trust-critical and must be confirmed before any endpoint sets it to true.
 * Do not add that capability without reviewing the identity-protection pattern.
 */
export async function submitComment(
  draftId: string,
  input: SubmitCommentInput,
): Promise<void> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const validated = SubmitCommentSchema.parse(input);

  await db.transaction(async (tx) => {
    await tx.insert(policyComments).values({
      draftId,
      // user.id is intentionally not stored — anonymization at write time
      anonymousId: generateAnonymousId(),
      regionLabel: validated.regionLabel,
      text: validated.text,
      isPolitician: false,
    });

    await tx
      .update(policyDrafts)
      .set({ commentCount: sql`${policyDrafts.commentCount} + 1` })
      .where(eq(policyDrafts.id, draftId));
  });

  revalidatePath(`/policy/${draftId}`);
}
