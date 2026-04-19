import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  searches,
  posts,
  postSentiments,
  searchAggregates,
  searchThemes,
} from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { createSupabaseServer } from "@/lib/supabase/server";
import ReportDetail from "./_components/report-detail";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [search] = await db
    .select()
    .from(searches)
    .where(and(eq(searches.id, id), eq(searches.userId, user.id)))
    .limit(1);

  if (!search) {
    notFound();
  }

  if (search.status !== "complete") {
    notFound();
  }

  const [aggregate] = await db
    .select()
    .from(searchAggregates)
    .where(eq(searchAggregates.searchId, id))
    .limit(1);

  const postRows = await db
    .select({
      id: posts.id,
      source: posts.source,
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

  const themeRows = await db
    .select()
    .from(searchThemes)
    .where(eq(searchThemes.searchId, id))
    .orderBy(asc(searchThemes.displayOrder));

  const report = {
    id: search.id,
    term: search.term,
    locationScope: search.locationScope,
    createdAt: search.createdAt.toISOString(),
    completedAt: search.completedAt?.toISOString() ?? null,
    aggregate: aggregate
      ? {
          totalPosts: aggregate.totalPosts,
          negativeCount: aggregate.negativeCount,
          neutralCount: aggregate.neutralCount,
          positiveCount: aggregate.positiveCount,
          meanSentiment: Number(aggregate.meanSentiment),
          confidence: Number(aggregate.confidence),
        }
      : null,
    posts: postRows.map((p) => ({
      id: p.id,
      source: p.source as "reddit" | "bluesky",
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
    })),
    themes: themeRows.map((t) => ({
      name: t.name,
      postCount: t.postCount,
      averageSentiment: Number(t.averageSentiment),
    })),
  };

  return <ReportDetail report={report} />;
}
