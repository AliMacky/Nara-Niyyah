import { db } from "@/lib/db";
import { posts, postSentiments, searchAggregates } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function computeAggregate(searchId: string): Promise<void> {
  const rows = await db
    .select({
      value: postSentiments.value,
      category: postSentiments.category,
      confidence: postSentiments.confidence,
    })
    .from(postSentiments)
    .innerJoin(posts, eq(posts.id, postSentiments.postId))
    .where(eq(posts.searchId, searchId));

  if (rows.length === 0) return;

  let negCount = 0;
  let neutCount = 0;
  let posCount = 0;
  let sumSentiment = 0;
  let sumConfidence = 0;

  for (const row of rows) {
    const val = Number(row.value);
    const conf = Number(row.confidence);
    sumSentiment += val;
    sumConfidence += conf;

    switch (row.category) {
      case "negative":
        negCount++;
        break;
      case "neutral":
        neutCount++;
        break;
      case "positive":
        posCount++;
        break;
    }
  }

  const total = rows.length;
  const meanSentiment = sumSentiment / total;
  const avgConfidence = sumConfidence / total;

  await db
    .insert(searchAggregates)
    .values({
      searchId,
      totalPosts: total,
      negativeCount: negCount,
      neutralCount: neutCount,
      positiveCount: posCount,
      meanSentiment: meanSentiment.toFixed(4),
      confidence: avgConfidence.toFixed(3),
    })
    .onConflictDoUpdate({
      target: searchAggregates.searchId,
      set: {
        totalPosts: sql`excluded.total_posts`,
        negativeCount: sql`excluded.negative_count`,
        neutralCount: sql`excluded.neutral_count`,
        positiveCount: sql`excluded.positive_count`,
        meanSentiment: sql`excluded.mean_sentiment`,
        confidence: sql`excluded.confidence`,
        computedAt: sql`now()`,
      },
    });
}
