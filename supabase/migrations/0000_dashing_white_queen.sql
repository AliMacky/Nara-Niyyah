CREATE TYPE "public"."post_source" AS ENUM('reddit', 'bluesky');--> statement-breakpoint
CREATE TYPE "public"."search_status" AS ENUM('pending', 'scraping', 'analyzing', 'extracting_themes', 'complete', 'failed');--> statement-breakpoint
CREATE TYPE "public"."sentiment_category" AS ENUM('negative', 'neutral', 'positive');--> statement-breakpoint
CREATE TABLE "post_sentiments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"value" numeric(4, 3) NOT NULL,
	"category" "sentiment_category" NOT NULL,
	"confidence" numeric(4, 3) NOT NULL,
	"reasoning" text,
	"analyzed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "post_sentiments_post_id_unique" UNIQUE("post_id")
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"search_id" uuid NOT NULL,
	"source" "post_source" NOT NULL,
	"external_id" text NOT NULL,
	"author_handle" text NOT NULL,
	"content" text NOT NULL,
	"url" text NOT NULL,
	"subreddit_or_feed" text,
	"posted_at" timestamp with time zone NOT NULL,
	"scraped_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "posts_search_source_ext" UNIQUE("search_id","source","external_id")
);
--> statement-breakpoint
CREATE TABLE "search_aggregates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"search_id" uuid NOT NULL,
	"total_posts" integer NOT NULL,
	"negative_count" integer NOT NULL,
	"neutral_count" integer NOT NULL,
	"positive_count" integer NOT NULL,
	"mean_sentiment" numeric(5, 4) NOT NULL,
	"confidence" numeric(4, 3) NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "search_aggregates_search_id_unique" UNIQUE("search_id")
);
--> statement-breakpoint
CREATE TABLE "search_themes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"search_id" uuid NOT NULL,
	"name" text NOT NULL,
	"post_count" integer NOT NULL,
	"average_sentiment" numeric(5, 4) NOT NULL,
	"display_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "searches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"term" text NOT NULL,
	"location_scope" text,
	"status" "search_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "post_sentiments" ADD CONSTRAINT "post_sentiments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_search_id_searches_id_fk" FOREIGN KEY ("search_id") REFERENCES "public"."searches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_aggregates" ADD CONSTRAINT "search_aggregates_search_id_searches_id_fk" FOREIGN KEY ("search_id") REFERENCES "public"."searches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_themes" ADD CONSTRAINT "search_themes_search_id_searches_id_fk" FOREIGN KEY ("search_id") REFERENCES "public"."searches"("id") ON DELETE cascade ON UPDATE no action;