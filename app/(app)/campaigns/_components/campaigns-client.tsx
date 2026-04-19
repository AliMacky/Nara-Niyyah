"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  NaraButton,
  UppercaseLabel,
  MetadataRow,
} from "@/components/nara";
import { sentimentColor } from "@/lib/design/sentiment-gradient";
import type { CampaignListItem } from "@/server/campaigns/queries";
import CreateCampaignDialog from "./create-campaign-dialog";

interface CampaignsClientProps {
  campaigns: CampaignListItem[];
}

const SCHEDULE_LABELS: Record<string, string> = {
  daily: "Daily",
  every_3_days: "Every 3 days",
  weekly: "Weekly",
  biweekly: "Biweekly",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  paused: "Paused",
  archived: "Archived",
};

export default function CampaignsClient({ campaigns }: CampaignsClientProps) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="max-w-3xl mx-auto px-8 lg:px-12 py-12 md:py-16">
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="font-serif text-[2.5rem] leading-[2.75rem] font-medium tracking-tight text-[var(--ink-900)]">
            Campaigns
          </h1>
          <p className="mt-2 text-[1rem] leading-[1.625rem] text-[var(--ink-500)] max-w-prose">
            Track sentiment on a topic over time. Each campaign runs periodic analyses
            and builds a time-series view of public opinion.
          </p>
        </div>
        <NaraButton
          variant="primary"
          onClick={() => setShowCreate(true)}
          className="shrink-0"
        >
          <Plus size={16} strokeWidth={1.75} className="mr-1.5" />
          New campaign
        </NaraButton>
      </div>

      {campaigns.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-[var(--ink-300)] text-[1.125rem]">
            No campaigns yet. Create one to start tracking sentiment over time.
          </p>
        </div>
      ) : (
        <div>
          {campaigns.map((campaign, i) => (
            <CampaignRow key={campaign.id} campaign={campaign} rank={i} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateCampaignDialog onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}

function CampaignRow({
  campaign,
  rank,
}: {
  campaign: CampaignListItem;
  rank: number;
}) {
  return (
    <article
      className={cn(
        "py-8",
        rank > 0 && "border-t border-[var(--paper-200)]",
      )}
    >
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <UppercaseLabel
              className={cn(
                campaign.status === "active"
                  ? "text-[var(--sentiment-pos-strong)]"
                  : campaign.status === "paused"
                    ? "text-[var(--ink-300)]"
                    : "text-[var(--ink-300)]",
              )}
            >
              {STATUS_LABELS[campaign.status]}
            </UppercaseLabel>
          </div>

          <h2 className="font-serif text-[1.5rem] leading-[2rem] font-medium text-[var(--ink-900)] mb-2">
            <Link
              href={`/campaigns/${campaign.id}`}
              className="hover:text-[var(--clay-600)] transition-colors duration-[120ms]"
            >
              {campaign.name}
            </Link>
          </h2>

          <p className="text-[1rem] leading-[1.5rem] text-[var(--ink-500)] mb-3">
            Tracking {campaign.terms.map((t, i) => (
              <span key={t}>
                {i > 0 && ", "}
                &ldquo;{t}&rdquo;
              </span>
            ))}
          </p>

          <MetadataRow
            items={[
              ...(campaign.locationScope
                ? [campaign.locationScope]
                : ["Everywhere"]),
              SCHEDULE_LABELS[campaign.scheduleInterval],
              `${campaign.totalRuns} run${campaign.totalRuns !== 1 ? "s" : ""}`,
              ...(campaign.lastRunAt
                ? [formatRelativeDate(campaign.lastRunAt)]
                : []),
            ]}
          />
        </div>

        {campaign.latestSentiment !== null && (
          <div className="shrink-0 text-right">
            <span
              className="font-serif text-[1.75rem] leading-[2rem] font-medium"
              style={{ color: sentimentColor(campaign.latestSentiment) }}
            >
              {campaign.latestSentiment > 0 ? "+" : ""}
              {campaign.latestSentiment.toFixed(2)}
            </span>
            <span className="block text-[0.75rem] text-[var(--ink-500)] mt-1">
              latest
            </span>
          </div>
        )}
      </div>
    </article>
  );
}

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
