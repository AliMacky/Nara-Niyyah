/**
 * server/policy/queries.ts
 *
 * Read-only functions for the policy platform. These are plain async functions
 * (no "use server") and are designed to be called directly from Server
 * Components.
 *
 * Return types and function signatures are intentionally identical to the
 * fake-api counterparts in app/_fake-api/policy.ts so page components can
 * swap their import with minimal changes.
 */

import { and, count, desc, eq, ilike } from "drizzle-orm";
import { db } from "@/lib/db";
import { policyComments, policyDrafts } from "@/lib/db/schema";

// ---------------------------------------------------------------------------
// Types (mirror app/_fake-api/policy.ts contracts exactly)
// ---------------------------------------------------------------------------

export interface AnonymousAuthor {
  anonymousId: string;
  regionLabel: string;
}

export interface VoteDisplay {
  /** Raw net vote count. Used server-side for sorting. Never shown directly in UI below threshold. */
  raw: number;
  /** Formatted display string, or null if raw < 10 (hidden per design spec). */
  display: string | null;
}

export type PolicyCategory =
  | "housing"
  | "transit"
  | "environment"
  | "education"
  | "public-safety"
  | "healthcare"
  | "economic-development"
  | "civil-rights";

export interface PolicyDraft {
  id: string;
  title: string;
  summary: string;
  body: string;
  author: AnonymousAuthor;
  region: string;
  category: PolicyCategory;
  votes: VoteDisplay;
  commentCount: number;
  aiAssisted: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PolicyFeedItem = Omit<PolicyDraft, "body">;

export interface PolicyFeed {
  items: PolicyFeedItem[];
  nextCursor: string | null;
  total: number;
}

export interface Comment {
  id: string;
  draftId: string;
  author: AnonymousAuthor;
  text: string;
  createdAt: string;
  isPolitician: boolean;
}

// ---------------------------------------------------------------------------
// Vote display logic (DESIGN_SYSTEM.md § Vote UI threshold rules)
// ---------------------------------------------------------------------------

function formatVoteDisplay(raw: number): VoteDisplay {
  if (raw < 10) return { raw, display: null };
  if (raw < 50) return { raw, display: "10+" };
  if (raw < 100) return { raw, display: "50+" };
  if (raw < 500) return { raw, display: "100+" };
  if (raw < 1000) return { raw, display: "500+" };
  return { raw, display: `${Math.floor(raw / 1000)}k+` };
}

// ---------------------------------------------------------------------------
// Row mapper
// ---------------------------------------------------------------------------

type DraftRow = typeof policyDrafts.$inferSelect;

function toDraft(row: DraftRow): PolicyDraft {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    body: row.body,
    author: {
      anonymousId: row.anonymousId,
      // region_label doubles as the author's region — set at write time
      regionLabel: row.regionLabel,
    },
    // draft.region and author.regionLabel are the same value (region of submission)
    region: row.regionLabel,
    category: row.category as PolicyCategory,
    votes: formatVoteDisplay(row.voteCount),
    commentCount: row.commentCount,
    aiAssisted: row.aiAssisted,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Strips `body` from a PolicyDraft to produce a feed list item. */
function toFeedItem(draft: PolicyDraft): PolicyFeedItem {
  return {
    id: draft.id,
    title: draft.title,
    summary: draft.summary,
    author: draft.author,
    region: draft.region,
    category: draft.category,
    votes: draft.votes,
    commentCount: draft.commentCount,
    aiAssisted: draft.aiAssisted,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const PAGE_SIZE = 6;

/**
 * Returns a paginated feed of policy drafts, optionally filtered by region and/or category.
 *
 * @param region    Optional partial match against region_label (case-insensitive).
 * @param category  Optional exact category slug (e.g. "housing"). Pass "all" or omit to fetch all.
 * @param cursor    Stringified integer offset for the next page (from nextCursor).
 */
export async function getPolicyFeed(
  region?: string,
  category?: string,
  cursor?: string,
): Promise<PolicyFeed> {
  const offset = cursor ? parseInt(cursor, 10) : 0;

  const whereClause = and(
    region ? ilike(policyDrafts.regionLabel, `%${region}%`) : undefined,
    category && category !== "all"
      ? eq(policyDrafts.category, category as PolicyCategory)
      : undefined,
  );

  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(policyDrafts)
      .where(whereClause)
      .orderBy(desc(policyDrafts.voteCount), desc(policyDrafts.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db.select({ total: count() }).from(policyDrafts).where(whereClause),
  ]);

  const hasMore = offset + PAGE_SIZE < total;

  return {
    items: rows.map((row) => toFeedItem(toDraft(row))),
    nextCursor: hasMore ? String(offset + PAGE_SIZE) : null,
    total,
  };
}

/**
 * Returns a single policy draft by ID, including the full body.
 * Returns null if the draft does not exist.
 */
export async function getPolicyDraft(id: string): Promise<PolicyDraft | null> {
  const rows = await db
    .select()
    .from(policyDrafts)
    .where(eq(policyDrafts.id, id))
    .limit(1);

  if (rows.length === 0) return null;
  return toDraft(rows[0]);
}

/**
 * Returns all comments for a given policy draft, ordered oldest-first.
 */
export async function getComments(draftId: string): Promise<Comment[]> {
  const rows = await db
    .select()
    .from(policyComments)
    .where(eq(policyComments.draftId, draftId))
    .orderBy(policyComments.createdAt);

  return rows.map((row) => ({
    id: row.id,
    draftId: row.draftId,
    author: {
      anonymousId: row.anonymousId,
      regionLabel: row.regionLabel,
    },
    text: row.text,
    createdAt: row.createdAt.toISOString(),
    isPolitician: row.isPolitician,
  }));
}
