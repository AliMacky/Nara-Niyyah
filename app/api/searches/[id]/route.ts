import { db } from "@/lib/db";
import {
  searches,
  posts,
  postSentiments,
  searchAggregates,
  searchThemes,
} from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Fetch search (only if owned by user)
  const [search] = await db
    .select()
    .from(searches)
    .where(eq(searches.id, id))
    .limit(1);

  if (!search || search.userId !== user.id) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const result: Record<string, unknown> = {
    id: search.id,
    term: search.term,
    locationScope: search.locationScope,
    status: search.status,
    createdAt: search.createdAt.toISOString(),
    completedAt: search.completedAt?.toISOString() ?? null,
  };

  // If still in progress, return just status + post count for progress display
  if (
    search.status === "scraping" ||
    search.status === "analyzing" ||
    search.status === "extracting_themes"
  ) {
    const postRows = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.searchId, id));
    result.postCount = postRows.length;
    return Response.json(result);
  }

  // If complete, include aggregate, posts with sentiments, and timeseries
  if (search.status === "complete") {
    const [aggregate] = await db
      .select()
      .from(searchAggregates)
      .where(eq(searchAggregates.searchId, id))
      .limit(1);

    if (aggregate) {
      result.aggregate = {
        totalPosts: aggregate.totalPosts,
        negativeCount: aggregate.negativeCount,
        neutralCount: aggregate.neutralCount,
        positiveCount: aggregate.positiveCount,
        meanSentiment: Number(aggregate.meanSentiment),
        confidence: Number(aggregate.confidence),
      };
    }

    const postRows = await db
      .select({
        id: posts.id,
        source: posts.source,
        externalId: posts.externalId,
        authorHandle: posts.authorHandle,
        content: posts.content,
        url: posts.url,
        subredditOrFeed: posts.subredditOrFeed,
        postedAt: posts.postedAt,
        sentimentValue: postSentiments.value,
        sentimentCategory: postSentiments.category,
        sentimentConfidence: postSentiments.confidence,
        reasoning: postSentiments.reasoning,
      })
      .from(posts)
      .leftJoin(postSentiments, eq(postSentiments.postId, posts.id))
      .where(eq(posts.searchId, id));

    result.posts = postRows.map((p) => ({
      id: p.id,
      source: p.source,
      authorHandle: p.authorHandle,
      content: p.content,
      url: p.url,
      subredditOrFeed: p.subredditOrFeed,
      postedAt: p.postedAt.toISOString(),
      sentiment: p.sentimentValue ? Number(p.sentimentValue) : null,
      category: p.sentimentCategory,
      confidence: p.sentimentConfidence
        ? Number(p.sentimentConfidence)
        : null,
      reasoning: p.reasoning,
    }));

    const themeRows = await db
      .select()
      .from(searchThemes)
      .where(eq(searchThemes.searchId, id))
      .orderBy(asc(searchThemes.displayOrder));

    result.themes = themeRows.map((t) => ({
      name: t.name,
      postCount: t.postCount,
      averageSentiment: Number(t.averageSentiment),
    }));
  }

  return Response.json(result);
}
