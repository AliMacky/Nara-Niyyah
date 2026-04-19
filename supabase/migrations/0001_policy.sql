CREATE TYPE "public"."policy_category" AS ENUM('housing', 'transit', 'environment', 'education', 'public-safety', 'healthcare', 'economic-development', 'civil-rights');--> statement-breakpoint
CREATE TABLE "policy_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"anonymous_id" text NOT NULL,
	"region_label" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"body" text NOT NULL,
	"category" "policy_category" NOT NULL,
	"ai_assisted" boolean DEFAULT false NOT NULL,
	"vote_count" integer DEFAULT 0 NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policy_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"draft_id" uuid NOT NULL,
	"voter_id" uuid NOT NULL,
	"value" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "policy_votes_draft_voter" UNIQUE("draft_id","voter_id")
);
--> statement-breakpoint
CREATE TABLE "policy_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"draft_id" uuid NOT NULL,
	"anonymous_id" text NOT NULL,
	"region_label" text NOT NULL,
	"text" text NOT NULL,
	"is_politician" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "policy_votes" ADD CONSTRAINT "policy_votes_draft_id_policy_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."policy_drafts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_comments" ADD CONSTRAINT "policy_comments_draft_id_policy_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."policy_drafts"("id") ON DELETE cascade ON UPDATE no action;
