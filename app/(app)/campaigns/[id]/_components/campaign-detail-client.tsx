"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Play, Pause, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  NaraButton,
  UppercaseLabel,
  MetadataRow,
  SentimentReadout,
  SentimentDistribution,
} from "@/components/nara";
import { sentimentColor } from "@/lib/design/sentiment-gradient";
import { runCampaignSearch } from "@/server/campaigns/run";
import { pauseCampaign, resumeCampaign, archiveCampaign } from "@/server/campaigns/actions";
import type { CampaignDetail, CampaignRunSummary } from "@/server/campaigns/queries";

interface CampaignDetailClientProps {
  campaign: CampaignDetail;
  runs: CampaignRunSummary[];
}

const SCHEDULE_LABELS: Record<string, string> = {
  daily: "Daily",
  every_3_days: "Every 3 days",
  weekly: "Weekly",
  biweekly: "Biweekly",
};

export default function CampaignDetailClient({
  campaign,
  runs,
}: CampaignDetailClientProps) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleRunNow = useCallback(async () => {
    setRunning(true);
    try {
      await runCampaignSearch(campaign.id);
      pollRef.current = setInterval(() => {
        router.refresh();
      }, 3000);
      setTimeout(() => {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
        setRunning(false);
      }, 60000);
    } catch {
      setRunning(false);
    }
  }, [campaign.id, router]);

  const handlePause = useCallback(async () => {
    setActionPending(true);
    await pauseCampaign(campaign.id);
    router.refresh();
    setActionPending(false);
  }, [campaign.id, router]);

  const handleResume = useCallback(async () => {
    setActionPending(true);
    await resumeCampaign(campaign.id);
    router.refresh();
    setActionPending(false);
  }, [campaign.id, router]);

  const handleArchive = useCallback(async () => {
    setActionPending(true);
    await archiveCampaign(campaign.id);
    router.push("/campaigns");
  }, [campaign.id, router]);

  const completedRuns = runs.filter((r) => r.status === "complete");
  const latestRun = completedRuns[0] ?? null;
  const inProgressRun = runs.find(
    (r) => r.status !== "complete" && r.status !== "failed",
  );

  return (
    <div className="max-w-4xl mx-auto px-8 lg:px-12 py-12 md:py-16">
      {/* Header */}
      <section className="mb-10">
        <UppercaseLabel className="mb-3 block text-[var(--ink-500)]">
          Campaign
        </UppercaseLabel>
        <h1 className="font-serif text-[2.5rem] leading-[2.75rem] font-medium tracking-tight text-[var(--ink-900)] mb-3">
          {campaign.name}
        </h1>
        <MetadataRow
          items={[
            campaign.terms.map((t) => `"${t}"`).join(", "),
            campaign.locationScope ?? "Everywhere",
            SCHEDULE_LABELS[campaign.scheduleInterval],
            `${completedRuns.length} completed run${completedRuns.length !== 1 ? "s" : ""}`,
          ]}
        />

        <div className="flex items-center gap-3 mt-6">
          <NaraButton
            variant="primary"
            onClick={handleRunNow}
            disabled={running || !!inProgressRun}
          >
            <Play size={14} strokeWidth={1.75} className="mr-1.5" />
            {running || inProgressRun ? "Running…" : "Run now"}
          </NaraButton>

          {campaign.status === "active" ? (
            <NaraButton
              variant="secondary"
              onClick={handlePause}
              disabled={actionPending}
            >
              <Pause size={14} strokeWidth={1.75} className="mr-1.5" />
              Pause
            </NaraButton>
          ) : campaign.status === "paused" ? (
            <NaraButton
              variant="secondary"
              onClick={handleResume}
              disabled={actionPending}
            >
              <Play size={14} strokeWidth={1.75} className="mr-1.5" />
              Resume
            </NaraButton>
          ) : null}

          {campaign.status !== "archived" && (
            <NaraButton
              variant="ghost"
              onClick={handleArchive}
              disabled={actionPending}
            >
              <Archive size={14} strokeWidth={1.75} className="mr-1.5" />
              Archive
            </NaraButton>
          )}
        </div>
      </section>

      {/* Latest readout */}
      {latestRun && latestRun.meanSentiment !== null && (
        <section className="pb-10">
          <SentimentReadout
            value={latestRun.meanSentiment}
            sampleSize={latestRun.totalPosts}
            confidence={latestRun.confidence ?? 0}
            timeRange={{
              start: latestRun.createdAt,
              end: latestRun.createdAt,
            }}
          />
        </section>
      )}

      {/* Distribution from latest run */}
      {latestRun && latestRun.totalPosts > 0 && (
        <section className="pb-10">
          <SectionDivider>Latest breakdown</SectionDivider>
          <div className="mt-4">
            <SentimentDistribution
              negative={latestRun.negativeCount}
              neutral={latestRun.neutralCount}
              positive={latestRun.positiveCount}
            />
          </div>
        </section>
      )}

      {/* Run history */}
      {runs.length > 0 && (
        <section>
          <SectionDivider>Run history</SectionDivider>
          <div className="mt-4">
            {runs.map((run, i) => (
              <RunRow key={run.searchId} run={run} rank={i} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {runs.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-[var(--ink-300)] text-[1.125rem]">
            No runs yet. Hit &ldquo;Run now&rdquo; to start collecting data.
          </p>
        </div>
      )}
    </div>
  );
}

function SectionDivider({ children }: { children: string }) {
  return (
    <div>
      <div className="w-16 h-px bg-[var(--paper-300)] mb-3" />
      <UppercaseLabel className="block">{children}</UppercaseLabel>
    </div>
  );
}

function RunRow({ run, rank }: { run: CampaignRunSummary; rank: number }) {
  const isComplete = run.status === "complete";
  const isFailed = run.status === "failed";
  const isRunning = !isComplete && !isFailed;

  return (
    <div
      className={cn(
        "py-5 flex items-center justify-between",
        rank > 0 && "border-t border-[var(--paper-200)]",
      )}
    >
      <div className="flex items-center gap-4">
        <div>
          <span className="text-[0.875rem] text-[var(--ink-700)]">
            {formatRunDate(run.createdAt)}
          </span>
          <span className="ml-3 text-[0.75rem] text-[var(--ink-300)]">
            {isRunning
              ? run.status.replace("_", " ").toUpperCase()
              : isComplete
                ? `${run.totalPosts} posts`
                : "FAILED"}
          </span>
        </div>
      </div>

      {isComplete && run.meanSentiment !== null && (
        <span
          className="font-mono text-[0.875rem] font-medium"
          style={{ color: sentimentColor(run.meanSentiment) }}
        >
          {run.meanSentiment > 0 ? "+" : ""}
          {run.meanSentiment.toFixed(2)}
        </span>
      )}

      {isRunning && (
        <span className="text-[0.75rem] uppercase tracking-wider text-[var(--ink-300)] animate-pulse">
          In progress
        </span>
      )}
    </div>
  );
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatRunDate(iso: string): string {
  const d = new Date(iso);
  const month = MONTHS[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${month} ${day}, ${year}, ${hour}:${m} ${ampm}`;
}
