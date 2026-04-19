"use server";

import { after } from "next/server";
import { db } from "@/lib/db";
import { searches } from "@/lib/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { runSearch } from "./run-search";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function submitSearch(
  term: string,
  locationScope?: string,
): Promise<{ searchId: string; cached: boolean }> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const normalizedTerm = term.trim().toLowerCase();
  const normalizedLocation = locationScope?.trim().toLowerCase() ?? null;

  // Check for same-day completed search with same term + location
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const conditions = [
    eq(searches.userId, user.id),
    eq(sql`lower(${searches.term})`, normalizedTerm),
    gte(searches.createdAt, todayStart),
  ];

  if (normalizedLocation) {
    conditions.push(eq(sql`lower(${searches.locationScope})`, normalizedLocation));
  } else {
    conditions.push(sql`${searches.locationScope} is null`);
  }

  const [existing] = await db
    .select()
    .from(searches)
    .where(and(...conditions))
    .orderBy(sql`${searches.createdAt} desc`)
    .limit(1);

  // If we have a completed or in-progress search from today, reuse it
  if (existing && existing.status !== "failed") {
    return { searchId: existing.id, cached: true };
  }

  // Create new search
  const [search] = await db
    .insert(searches)
    .values({
      userId: user.id,
      term,
      locationScope: locationScope ?? null,
    })
    .returning();

  after(async () => {
    try {
      await runSearch(search.id);
    } catch (err) {
      console.error(`[after] runSearch failed for ${search.id}:`, err);
    }
  });

  return { searchId: search.id, cached: false };
}
