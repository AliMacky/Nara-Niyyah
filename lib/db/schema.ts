import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  integer,
  numeric,
  boolean,
  unique,
  index,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const searchStatusEnum = pgEnum("search_status", [
  "pending",
  "scraping",
  "analyzing",
  "extracting_themes",
  "complete",
  "failed",
]);

export const postSourceEnum = pgEnum("post_source", ["reddit", "bluesky"]);

export const sentimentCategoryEnum = pgEnum("sentiment_category", [
  "negative",
  "neutral",
  "positive",
]);

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const searches = pgTable("searches", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  campaignId: uuid("campaign_id"),
  term: text("term").notNull(),
  locationScope: text("location_scope"),
  status: searchStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    searchId: uuid("search_id")
      .notNull()
      .references(() => searches.id, { onDelete: "cascade" }),
    source: postSourceEnum("source").notNull(),
    externalId: text("external_id").notNull(),
    authorHandle: text("author_handle").notNull(),
    content: text("content").notNull(),
    url: text("url").notNull(),
    subredditOrFeed: text("subreddit_or_feed"),
    postedAt: timestamp("posted_at", { withTimezone: true }).notNull(),
    scrapedAt: timestamp("scraped_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique("posts_search_source_ext").on(t.searchId, t.source, t.externalId)],
);

export const postSentiments = pgTable("post_sentiments", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id")
    .notNull()
    .unique()
    .references(() => posts.id, { onDelete: "cascade" }),
  value: numeric("value", { precision: 4, scale: 3 }).notNull(),
  category: sentimentCategoryEnum("category").notNull(),
  confidence: numeric("confidence", { precision: 4, scale: 3 }).notNull(),
  reasoning: text("reasoning"),
  analyzedAt: timestamp("analyzed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const searchAggregates = pgTable("search_aggregates", {
  id: uuid("id").defaultRandom().primaryKey(),
  searchId: uuid("search_id")
    .notNull()
    .unique()
    .references(() => searches.id, { onDelete: "cascade" }),
  totalPosts: integer("total_posts").notNull(),
  negativeCount: integer("negative_count").notNull(),
  neutralCount: integer("neutral_count").notNull(),
  positiveCount: integer("positive_count").notNull(),
  meanSentiment: numeric("mean_sentiment", { precision: 5, scale: 4 }).notNull(),
  confidence: numeric("confidence", { precision: 4, scale: 3 }).notNull(),
  computedAt: timestamp("computed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const searchThemes = pgTable("search_themes", {
  id: uuid("id").defaultRandom().primaryKey(),
  searchId: uuid("search_id")
    .notNull()
    .references(() => searches.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  postCount: integer("post_count").notNull(),
  averageSentiment: numeric("average_sentiment", { precision: 5, scale: 4 }).notNull(),
  displayOrder: integer("display_order").notNull(),
});

// ---------------------------------------------------------------------------
// Campaigns
// ---------------------------------------------------------------------------

export const campaignStatusEnum = pgEnum("campaign_status", [
  "active",
  "paused",
  "archived",
]);

export const scheduleIntervalEnum = pgEnum("schedule_interval", [
  "daily",
  "every_3_days",
  "weekly",
  "biweekly",
]);

export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    terms: text("terms").array().notNull(),
    locationScope: text("location_scope"),
    scheduleInterval: scheduleIntervalEnum("schedule_interval")
      .notNull()
      .default("weekly"),
    status: campaignStatusEnum("status").notNull().default("active"),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("campaigns_user_idx").on(t.userId)],
);

// ---------------------------------------------------------------------------
// Policy Platform
// ---------------------------------------------------------------------------

export const policyCategoryEnum = pgEnum("policy_category", [
  "housing",
  "transit",
  "environment",
  "education",
  "public-safety",
  "healthcare",
  "economic-development",
  "civil-rights",
]);

/**
 * Policy drafts submitted by anonymous citizens.
 *
 * PRIVACY: No `user_id` column — the author's Supabase identity is never
 * stored here. `anonymous_id` ("citizen-XXXX") is generated at write time
 * and is the only identity persisted alongside the draft.
 */
export const policyDrafts = pgTable("policy_drafts", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** Display-safe pseudonym, e.g. "citizen-4812". Generated server-side at insert. */
  anonymousId: text("anonymous_id").notNull(),
  /** Human-readable region, e.g. "King County, WA". Used for both draft.region and author.regionLabel. */
  regionLabel: text("region_label").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  body: text("body").notNull(),
  category: policyCategoryEnum("category").notNull(),
  aiAssisted: boolean("ai_assisted").notNull().default(false),
  /** Denormalized net vote count (upvotes minus downvotes). Updated transactionally on each vote. */
  voteCount: integer("vote_count").notNull().default(0),
  /** Denormalized comment count. Updated transactionally on each comment insert. */
  commentCount: integer("comment_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Tracks individual votes on policy drafts.
 *
 * `voter_id` is the Supabase auth UID of the person who voted. This is stored
 * separately from the draft's `anonymous_id` so there is no join path from a
 * draft back to its author's identity.
 */
export const policyVotes = pgTable(
  "policy_votes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    draftId: uuid("draft_id")
      .notNull()
      .references(() => policyDrafts.id, { onDelete: "cascade" }),
    /** Supabase auth.uid() of the voter — NOT the draft author. */
    voterId: uuid("voter_id").notNull(),
    /** +1 for support, -1 for opposition. */
    value: integer("value").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("policy_votes_draft_voter").on(t.draftId, t.voterId)],
);

/**
 * Comments on policy drafts.
 *
 * PRIVACY: Same anonymization model as policy_drafts — no user_id stored.
 * `anonymous_id` is generated at write time.
 */
export const policyComments = pgTable("policy_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  draftId: uuid("draft_id")
    .notNull()
    .references(() => policyDrafts.id, { onDelete: "cascade" }),
  /** Display-safe pseudonym, e.g. "citizen-2391". Generated server-side at insert. */
  anonymousId: text("anonymous_id").notNull(),
  /** Human-readable region of the commenter, e.g. "Cook County, IL". */
  regionLabel: text("region_label").notNull(),
  text: text("text").notNull(),
  /**
   * True if the commenter is a verified politician account.
   * This flag is set through a separate politician auth flow — do NOT set
   * this to true from citizen-facing endpoints without confirming the
   * identity-protection pattern.
   */
  isPolitician: boolean("is_politician").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
