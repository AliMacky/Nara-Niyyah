import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { searches, searchAggregates } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { createSupabaseServer } from "@/lib/supabase/server";
import ReportsClient from "./_components/reports-client";

export default async function ReportsPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const rows = await db
    .select({
      id: searches.id,
      term: searches.term,
      locationScope: searches.locationScope,
      status: searches.status,
      createdAt: searches.createdAt,
      completedAt: searches.completedAt,
      totalPosts: searchAggregates.totalPosts,
      meanSentiment: searchAggregates.meanSentiment,
      confidence: searchAggregates.confidence,
    })
    .from(searches)
    .leftJoin(searchAggregates, eq(searchAggregates.searchId, searches.id))
    .where(eq(searches.userId, user.id))
    .orderBy(desc(searches.createdAt));

  const reports = rows.map((r) => ({
    id: r.id,
    term: r.term,
    locationScope: r.locationScope,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    completedAt: r.completedAt?.toISOString() ?? null,
    totalPosts: r.totalPosts ?? 0,
    meanSentiment: r.meanSentiment ? Number(r.meanSentiment) : null,
    confidence: r.confidence ? Number(r.confidence) : null,
  }));

  return <ReportsClient reports={reports} />;
}
