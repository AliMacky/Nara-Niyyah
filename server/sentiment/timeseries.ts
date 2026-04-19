import { db } from "@/lib/db";
import { posts, postSentiments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { TimeseriesBucket } from "@/lib/types/timeseries";

interface PostWithSentiment {
  postedAt: Date;
  value: string;
  category: "negative" | "neutral" | "positive";
  source: "reddit" | "bluesky";
}

export async function buildTimeseries(
  searchId: string,
): Promise<TimeseriesBucket[]> {
  const rows = await db
    .select({
      postedAt: posts.postedAt,
      value: postSentiments.value,
      category: postSentiments.category,
      source: posts.source,
    })
    .from(posts)
    .innerJoin(postSentiments, eq(postSentiments.postId, posts.id))
    .where(eq(posts.searchId, searchId));

  if (rows.length === 0) return [];

  const typed: PostWithSentiment[] = rows.map((r) => ({
    postedAt: r.postedAt,
    value: r.value,
    category: r.category,
    source: r.source,
  }));

  // Determine bucketing: if span ≤ 24h → bucket by hour, else by day
  const timestamps = typed.map((r) => r.postedAt.getTime());
  const min = Math.min(...timestamps);
  const max = Math.max(...timestamps);
  const spanMs = max - min;
  const spanHours = spanMs / (1000 * 60 * 60);

  const bucketByHour = spanHours <= 24;

  // Group posts into buckets
  const bucketMap = new Map<
    string,
    {
      date: Date;
      values: number[];
      negativeCount: number;
      neutralCount: number;
      positiveCount: number;
      reddit: number;
      bluesky: number;
    }
  >();

  for (const row of typed) {
    const d = row.postedAt;
    let key: string;
    let bucketDate: Date;

    if (bucketByHour) {
      bucketDate = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        d.getHours(),
      );
      key = bucketDate.toISOString();
    } else {
      bucketDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      key = bucketDate.toISOString();
    }

    let bucket = bucketMap.get(key);
    if (!bucket) {
      bucket = {
        date: bucketDate,
        values: [],
        negativeCount: 0,
        neutralCount: 0,
        positiveCount: 0,
        reddit: 0,
        bluesky: 0,
      };
      bucketMap.set(key, bucket);
    }

    const val = Number(row.value);
    bucket.values.push(val);

    switch (row.category) {
      case "negative":
        bucket.negativeCount++;
        break;
      case "neutral":
        bucket.neutralCount++;
        break;
      case "positive":
        bucket.positiveCount++;
        break;
    }

    if (row.source === "reddit") bucket.reddit++;
    else bucket.bluesky++;
  }

  // Convert to sorted TimeseriesBucket array
  const buckets: TimeseriesBucket[] = Array.from(bucketMap.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((b) => {
      const mean =
        b.values.reduce((sum, v) => sum + v, 0) / b.values.length;
      return {
        date: b.date.toISOString(),
        value: Math.round(mean * 100) / 100,
        sampleSize: b.values.length,
        negativeCount: b.negativeCount,
        neutralCount: b.neutralCount,
        positiveCount: b.positiveCount,
        platformBreakdown: {
          reddit: b.reddit,
          x: 0, // X not implemented yet; field required by component interface
          instagram: 0,
        },
      };
    });

  return buckets;
}
