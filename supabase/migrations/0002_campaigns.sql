CREATE TYPE "public"."campaign_status" AS ENUM('active', 'paused', 'archived');
CREATE TYPE "public"."schedule_interval" AS ENUM('daily', 'every_3_days', 'weekly', 'biweekly');

CREATE TABLE "campaigns" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "name" text NOT NULL,
  "terms" text[] NOT NULL,
  "location_scope" text,
  "schedule_interval" "schedule_interval" NOT NULL DEFAULT 'weekly',
  "status" "campaign_status" NOT NULL DEFAULT 'active',
  "last_run_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "campaigns_user_idx" ON "campaigns" ("user_id");

ALTER TABLE "searches" ADD COLUMN "campaign_id" uuid;
ALTER TABLE "searches" ADD CONSTRAINT "searches_campaign_id_campaigns_id_fk"
  FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL;
