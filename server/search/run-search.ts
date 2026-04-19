import { db } from "@/lib/db";
import { searches, posts, postSentiments, searchThemes } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { scrapeReddit } from "@/server/scrapers/reddit";
import { scrapeBluesky } from "@/server/scrapers/bluesky";
import { analyzePosts } from "@/server/sentiment/analyze";
import { computeAggregate } from "@/server/sentiment/aggregate";
import { extractThemes } from "@/server/sentiment/extract-themes";
import type { ScrapedPost } from "@/server/scrapers/types";

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

async function setStatus(
  searchId: string,
  status:
    | "pending"
    | "scraping"
    | "analyzing"
    | "extracting_themes"
    | "complete"
    | "failed",
  completedAt?: Date,
) {
  await db
    .update(searches)
    .set({ status, ...(completedAt ? { completedAt } : {}) })
    .where(eq(searches.id, searchId));
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

export async function runSearch(searchId: string, termsOverride?: string[]): Promise<void> {
  const [search] = await db
    .select()
    .from(searches)
    .where(eq(searches.id, searchId))
    .limit(1);

  if (!search) {
    throw new Error(`Search ${searchId} not found`);
  }

  const searchTerms = termsOverride ?? [search.term];
  const isCampaignRun = !!search.campaignId;

  try {
    // ---- Stage 1: Scrape ----
    await setStatus(searchId, "scraping");
    console.log(`[search] scraping for ${searchTerms.map(t => `"${t}"`).join(", ")} (scope: ${search.locationScope ?? "global"})`);

    let scrapeOptions: { sort: "new" | "relevance"; timeRange: "hour" | "day" | "week" | "month" | "year" | "all"; limit: number } | undefined;

    if (isCampaignRun && search.campaignId) {
      const priorRunCount = await db
        .select({ id: searches.id })
        .from(searches)
        .where(
          and(
            eq(searches.campaignId, search.campaignId),
            eq(searches.status, "complete"),
          ),
        )
        .then((rows) => rows.length);

      const timeRanges = ["week", "month", "year", "all"] as const;
      const rangeIdx = Math.min(priorRunCount, timeRanges.length - 1);

      scrapeOptions = {
        sort: "new",
        timeRange: timeRanges[rangeIdx],
        limit: priorRunCount >= 2 ? 100 : 50,
      };

      console.log(`[search] campaign run #${priorRunCount + 1}, time range: ${scrapeOptions.timeRange}, limit: ${scrapeOptions.limit}`);
    }

    const scrapeResults = await Promise.all(
      searchTerms.flatMap((term) => [
        scrapeReddit(term, search.locationScope ?? undefined, scrapeOptions ? { sort: scrapeOptions.sort, timeRange: scrapeOptions.timeRange, limit: scrapeOptions.limit } : undefined),
        scrapeBluesky(term, search.locationScope ?? undefined),
      ]),
    );

    const allScraped: ScrapedPost[] = scrapeResults.flat();

    const seen = new Set<string>();
    let deduped = allScraped.filter((p) => {
      const key = `${p.source}:${p.externalId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (isCampaignRun && search.campaignId) {
      const priorSearchIds = await db
        .select({ id: searches.id })
        .from(searches)
        .where(
          and(
            eq(searches.campaignId, search.campaignId),
            eq(searches.status, "complete"),
          ),
        );

      if (priorSearchIds.length > 0) {
        const existingExternalIds = await db
          .select({ externalId: posts.externalId, source: posts.source })
          .from(posts)
          .where(
            inArray(
              posts.searchId,
              priorSearchIds.map((s) => s.id),
            ),
          );

        const knownKeys = new Set(
          existingExternalIds.map((p) => `${p.source}:${p.externalId}`),
        );

        const beforeCount = deduped.length;
        deduped = deduped.filter(
          (p) => !knownKeys.has(`${p.source}:${p.externalId}`),
        );
        console.log(
          `[search] excluded ${beforeCount - deduped.length} already-seen posts`,
        );
      }
    }

    console.log(
      `[search] ${deduped.length} new posts to process`,
    );

    if (deduped.length === 0) {
      await setStatus(searchId, "complete", new Date());
      console.log(`[search] no posts found, marking complete`);
      return;
    }

    // ---- Stage 2: Insert posts ----
    const insertedPosts = await db
      .insert(posts)
      .values(
        deduped.map((p) => ({
          searchId,
          source: p.source,
          externalId: p.externalId,
          authorHandle: p.authorHandle,
          content: p.content,
          url: p.url,
          subredditOrFeed: p.subredditOrFeed,
          postedAt: p.postedAt,
        })),
      )
      .onConflictDoNothing()
      .returning({ id: posts.id });

    console.log(`[search] inserted ${insertedPosts.length} posts`);

    // ---- Stage 3: Analyze sentiment ----
    await setStatus(searchId, "analyzing");
    const sentiments = await analyzePosts(search.term, deduped);
    console.log(`[search] analyzed ${sentiments.length} posts`);

    // ---- Stage 4: Insert sentiments ----
    if (sentiments.length > 0 && insertedPosts.length > 0) {
      const sentimentValues = sentiments
        .filter((s) => s.index < insertedPosts.length)
        .map((s) => ({
          postId: insertedPosts[s.index].id,
          value: s.value.toFixed(3),
          category: s.category,
          confidence: s.confidence.toFixed(3),
          reasoning: s.reasoning,
        }));

      if (sentimentValues.length > 0) {
        await db
          .insert(postSentiments)
          .values(sentimentValues)
          .onConflictDoNothing();
      }
    }

    // ---- Stage 5: Aggregate ----
    await computeAggregate(searchId);

    // ---- Stage 6: Extract themes ----
    await setStatus(searchId, "extracting_themes");
    console.log(`[search] extracting themes`);

    const postsWithSentiment = sentiments
      .filter((s) => s.index < deduped.length && s.confidence > 0)
      .map((s) => ({
        index: s.index,
        content: deduped[s.index].content,
        sentiment: s.value,
      }));

    const themes = await extractThemes(search.term, postsWithSentiment);
    console.log(`[search] extracted ${themes.length} themes`);

    if (themes.length > 0) {
      await db.insert(searchThemes).values(
        themes.map((t, i) => ({
          searchId,
          name: t.name,
          postCount: t.postCount,
          averageSentiment: t.averageSentiment.toFixed(4),
          displayOrder: i,
        })),
      );
    }

    // ---- Done ----
    await setStatus(searchId, "complete", new Date());
    console.log(`[search] complete: ${searchId}`);
  } catch (err) {
    console.error(`[search] failed: ${searchId}`, err);
    await setStatus(searchId, "failed");
    throw err;
  }
}
