"use client";

import { cn } from "@/lib/utils";
import { sentimentColor } from "@/lib/design/sentiment-gradient";
import { MapPin } from "lucide-react";
import { UppercaseLabel } from "@/components/nara";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReportRow {
  id: string;
  term: string;
  locationScope: string | null;
  status: string;
  createdAt: string;
  completedAt: string | null;
  totalPosts: number;
  meanSentiment: number | null;
  confidence: number | null;
}

interface ReportsClientProps {
  reports: ReportRow[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

function sentimentLabel(value: number): string {
  const abs = Math.abs(value);
  if (abs < 0.1) return "Neutral";
  if (abs < 0.35) return value > 0 ? "Leaning positive" : "Leaning negative";
  if (abs < 0.65) return value > 0 ? "Positive" : "Negative";
  return value > 0 ? "Strongly positive" : "Strongly negative";
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "Pending",
    scraping: "Scraping",
    analyzing: "Analyzing",
    extracting_themes: "Extracting themes",
    failed: "Failed",
  };
  return map[status] ?? status;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ReportsClient({ reports }: ReportsClientProps) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Page header */}
      <h1 className="font-serif text-[1.75rem] leading-[2.25rem] font-medium text-[var(--ink-900)]">
        Reports
      </h1>
      <p className="text-[0.875rem] leading-[1.25rem] text-[var(--ink-500)] mt-2">
        Search history and sentiment analyses
      </p>

      {reports.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-[1rem] text-[var(--ink-500)]">
            No searches yet. Run your first search from the dashboard.
          </p>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-3">
          {reports.map((report) => {
            const isComplete = report.status === "complete";
            const hasSentiment =
              isComplete && report.meanSentiment !== null;

            return (
              <a
                key={report.id}
                href={`/reports/${report.id}`}
                className={cn(
                  "block p-5 group rounded-lg",
                  "border border-[var(--paper-200)] bg-[var(--paper-100)]",
                  "transition-all duration-[120ms]",
                  "hover:border-[var(--paper-300)] hover:bg-[var(--paper-150,var(--paper-100))] hover:shadow-sm",
                )}
              >
                <div className="flex items-start justify-between gap-6">
                  {/* Left: term + metadata */}
                  <div className="min-w-0 flex-1">
                    <h2 className="font-serif text-[1.25rem] leading-[1.75rem] font-medium text-[var(--ink-900)] group-hover:text-[var(--clay-700)] transition-colors truncate">
                      {report.term}
                    </h2>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                      {report.locationScope && (
                        <span className="inline-flex items-center gap-1 text-[0.75rem] leading-[1rem] font-medium text-[var(--ink-500)]">
                          <MapPin size={12} strokeWidth={1.75} />
                          {report.locationScope}
                        </span>
                      )}
                      <UppercaseLabel>
                        {formatDate(report.createdAt)} at{" "}
                        {formatTime(report.createdAt)}
                      </UppercaseLabel>
                      {isComplete && report.totalPosts > 0 && (
                        <UppercaseLabel>
                          {report.totalPosts}{" "}
                          {report.totalPosts === 1 ? "post" : "posts"}
                        </UppercaseLabel>
                      )}
                      {!isComplete && (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5",
                            "text-[0.75rem] leading-[1rem] font-medium uppercase tracking-wider",
                            report.status === "failed"
                              ? "text-[var(--sentiment-neg-strong)]"
                              : "text-[var(--ink-400)]",
                          )}
                        >
                          {report.status !== "failed" && (
                            <span className="inline-block size-1.5 rounded-full bg-current animate-pulse" />
                          )}
                          {statusLabel(report.status)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: sentiment indicator */}
                  {hasSentiment && (
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block size-3 rounded-full"
                          style={{
                            backgroundColor: sentimentColor(
                              report.meanSentiment!,
                            ),
                          }}
                        />
                        <span className="font-serif text-[1.125rem] leading-[1.5rem] font-medium text-[var(--ink-900)]">
                          {Math.abs(report.meanSentiment!).toFixed(2)}
                        </span>
                      </div>
                      <span className="text-[0.6875rem] leading-[1rem] font-medium text-[var(--ink-500)]">
                        {sentimentLabel(report.meanSentiment!)}
                      </span>
                    </div>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
