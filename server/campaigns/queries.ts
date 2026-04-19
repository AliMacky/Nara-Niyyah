import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { campaigns, searches, searchAggregates } from "@/lib/db/schema";
import type { TimeseriesBucket } from "@/lib/types/timeseries";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CampaignListItem {
  id: string;
  name: string;
  terms: string[];
  locationScope: string | null;
  scheduleInterval: string;
  status: "active" | "paused" | "archived";
  lastRunAt: string | null;
  createdAt: string;
  totalRuns: number;
  latestSentiment: number | null;
}

export interface CampaignDetail {
  id: string;
  name: string;
  terms: string[];
  locationScope: string | null;
  scheduleInterval: string;
  status: "active" | "paused" | "archived";
  lastRunAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignRunSummary {
  searchId: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
  totalPosts: number;
  meanSentiment: number | null;
  confidence: number | null;
  negativeCount: number;
  neutralCount: number;
  positiveCount: number;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getCampaigns(userId: string): Promise<CampaignListItem[]> {
  const rows = await db
    .select({
      id: campaigns.id,
      name: campaigns.name,
      terms: campaigns.terms,
      locationScope: campaigns.locationScope,
      scheduleInterval: campaigns.scheduleInterval,
      status: campaigns.status,
      lastRunAt: campaigns.lastRunAt,
      createdAt: campaigns.createdAt,
    })
    .from(campaigns)
    .where(eq(campaigns.userId, userId))
    .orderBy(desc(campaigns.updatedAt));

  const results: CampaignListItem[] = [];

  for (const row of rows) {
    const [{ runCount }] = await db
      .select({ runCount: count() })
      .from(searches)
      .where(eq(searches.campaignId, row.id));

    const [latestSearch] = await db
      .select({ meanSentiment: searchAggregates.meanSentiment })
      .from(searches)
      .innerJoin(searchAggregates, eq(searchAggregates.searchId, searches.id))
      .where(
        and(eq(searches.campaignId, row.id), eq(searches.status, "complete")),
      )
      .orderBy(desc(searches.createdAt))
      .limit(1);

    results.push({
      id: row.id,
      name: row.name,
      terms: row.terms,
      locationScope: row.locationScope,
      scheduleInterval: row.scheduleInterval,
      status: row.status,
      lastRunAt: row.lastRunAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      totalRuns: runCount,
      latestSentiment: latestSearch?.meanSentiment
        ? Number(latestSearch.meanSentiment)
        : null,
    });
  }

  return results;
}

export async function getCampaignDetail(
  campaignId: string,
  userId: string,
): Promise<CampaignDetail | null> {
  const [row] = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId)))
    .limit(1);

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    terms: row.terms,
    locationScope: row.locationScope,
    scheduleInterval: row.scheduleInterval,
    status: row.status,
    lastRunAt: row.lastRunAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getCampaignRuns(
  campaignId: string,
): Promise<CampaignRunSummary[]> {
  const rows = await db
    .select({
      searchId: searches.id,
      status: searches.status,
      createdAt: searches.createdAt,
      completedAt: searches.completedAt,
      totalPosts: searchAggregates.totalPosts,
      meanSentiment: searchAggregates.meanSentiment,
      confidence: searchAggregates.confidence,
      negativeCount: searchAggregates.negativeCount,
      neutralCount: searchAggregates.neutralCount,
      positiveCount: searchAggregates.positiveCount,
    })
    .from(searches)
    .leftJoin(searchAggregates, eq(searchAggregates.searchId, searches.id))
    .where(eq(searches.campaignId, campaignId))
    .orderBy(desc(searches.createdAt));

  return rows.map((r) => ({
    searchId: r.searchId,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    completedAt: r.completedAt?.toISOString() ?? null,
    totalPosts: r.totalPosts ?? 0,
    meanSentiment: r.meanSentiment ? Number(r.meanSentiment) : null,
    confidence: r.confidence ? Number(r.confidence) : null,
    negativeCount: r.negativeCount ?? 0,
    neutralCount: r.neutralCount ?? 0,
    positiveCount: r.positiveCount ?? 0,
  }));
}

export async function getCampaignTimeseries(
  campaignId: string,
): Promise<TimeseriesBucket[]> {
  const runs = await getCampaignRuns(campaignId);

  const completedRuns = runs.filter(
    (r) => r.status === "complete" && r.meanSentiment !== null,
  );

  if (completedRuns.length === 0) return [];

  return completedRuns
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
    .map((r) => ({
      date: r.createdAt,
      value: r.meanSentiment!,
      sampleSize: r.totalPosts,
      negativeCount: r.negativeCount,
      neutralCount: r.neutralCount,
      positiveCount: r.positiveCount,
      platformBreakdown: { reddit: 0, x: 0, instagram: 0 },
    }));
}
