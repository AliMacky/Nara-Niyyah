"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SentimentReadout,
  SentimentDistribution,
  ThemeBreakdown,
  MetadataRow,
  UppercaseLabel,
  NaraButton,
} from "@/components/nara";
import type { ThemeData } from "@/components/nara";
import { sentimentColor } from "@/lib/design/sentiment-gradient";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PostData {
  id: string;
  source: "reddit" | "bluesky";
  authorHandle: string;
  content: string;
  url: string;
  subredditOrFeed: string | null;
  postedAt: string;
  sentiment: number | null;
  category: "negative" | "neutral" | "positive" | null;
  confidence: number | null;
  reasoning: string | null;
}

interface AggregateData {
  totalPosts: number;
  negativeCount: number;
  neutralCount: number;
  positiveCount: number;
  meanSentiment: number;
  confidence: number;
}

interface ReportData {
  id: string;
  term: string;
  locationScope: string | null;
  createdAt: string;
  completedAt: string | null;
  aggregate: AggregateData | null;
  posts: PostData[];
  themes: ThemeData[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });
  const yearFmt = new Intl.DateTimeFormat("en-US", { year: "numeric" });
  return `${fmt.format(s)}\u2013${fmt.format(e)}, ${yearFmt.format(e)}`;
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

function SectionHeader({ children }: { children: string }) {
  return (
    <div>
      <div className="w-16 h-px bg-[var(--paper-300)] mb-3" />
      <UppercaseLabel className="block">{children}</UppercaseLabel>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ReportDetail({ report }: { report: ReportData }) {
  const [visiblePosts, setVisiblePosts] = useState(8);

  const aggregate = report.aggregate;
  const themes = report.themes;

  const postsList = report.posts
    .filter((p) => p.confidence === null || p.confidence > 0)
    .sort((a, b) => {
      const timeDiff =
        new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
      if (Math.abs(timeDiff) > 86400000) return timeDiff;
      return (b.confidence ?? 0) - (a.confidence ?? 0);
    });

  const distribution = aggregate
    ? {
        neg: aggregate.negativeCount,
        neut: aggregate.neutralCount,
        pos: aggregate.positiveCount,
      }
    : { neg: 0, neut: 0, pos: 0 };

  const timeRange =
    postsList.length > 0
      ? {
          start: postsList.reduce((min, p) =>
            p.postedAt < min.postedAt ? p : min,
          ).postedAt,
          end: postsList.reduce((max, p) =>
            p.postedAt > max.postedAt ? p : max,
          ).postedAt,
        }
      : { start: new Date().toISOString(), end: new Date().toISOString() };

  return (
    <div className="max-w-4xl mx-auto px-8 lg:px-12 py-12 md:py-16">
      {/* Back link */}
      <Link
        href="/reports"
        className={cn(
          "inline-flex items-center gap-1.5",
          "text-[0.875rem] leading-[1.25rem] font-medium text-[var(--ink-500)]",
          "hover:text-[var(--ink-900)] transition-colors duration-120",
        )}
      >
        <ArrowLeft size={14} strokeWidth={1.75} />
        All reports
      </Link>

      {/* Title */}
      <h1
        className={cn(
          "font-serif text-[2rem] leading-[2.5rem] font-medium tracking-tight",
          "text-[var(--ink-900)] mt-6",
        )}
      >
        {report.term}
      </h1>

      {report.locationScope && (
        <span className="inline-flex items-center gap-1.5 mt-2 text-[0.875rem] leading-[1.25rem] text-[var(--ink-500)]">
          <MapPin size={14} strokeWidth={1.75} />
          {report.locationScope}
        </span>
      )}

      {/* Results */}
      {aggregate && (
        <>
          <section className="pt-8">
            <MetadataRow
              items={[
                report.term,
                ...(report.locationScope ? [report.locationScope] : []),
                formatDateRange(timeRange.start, timeRange.end),
              ].filter(Boolean)}
            />
          </section>

          <section className="pt-6 pb-10">
            <SentimentReadout
              value={aggregate.meanSentiment}
              sampleSize={aggregate.totalPosts}
              confidence={aggregate.confidence}
              timeRange={timeRange}
            />
          </section>

          {themes.length > 0 && (
            <section className="pb-10">
              <SectionHeader>Themes</SectionHeader>
              <div className="mt-4">
                <ThemeBreakdown themes={themes} />
              </div>
            </section>
          )}

          {(distribution.neg > 0 ||
            distribution.neut > 0 ||
            distribution.pos > 0) && (
            <section className="pb-10">
              <SectionHeader>Breakdown</SectionHeader>
              <div className="mt-4">
                <SentimentDistribution
                  negative={distribution.neg}
                  neutral={distribution.neut}
                  positive={distribution.pos}
                />
              </div>
            </section>
          )}

          {postsList.length > 0 && (
            <section>
              <SectionHeader>Recent posts</SectionHeader>
              <div className="mt-4">
                {postsList.slice(0, visiblePosts).map((post, i) => {
                  const sentiment = post.sentiment ?? 0;

                  if (i === 0) {
                    return (
                      <article key={post.id} className="py-8">
                        <span className="block text-[0.75rem] leading-[1rem] font-medium uppercase tracking-wider text-[var(--ink-500)] mb-4">
                          Featured
                        </span>
                        <blockquote
                          className="max-w-prose pl-5"
                          style={{
                            borderLeft: `2px solid ${sentimentColor(sentiment)}`,
                          }}
                        >
                          <p className="font-serif text-[1.5rem] leading-[2rem] font-medium tracking-tight text-[var(--ink-700)]">
                            {post.content}
                          </p>
                        </blockquote>
                        <div className="mt-4 pl-5 flex items-center gap-4">
                          <MetadataRow
                            items={[
                              post.source === "reddit"
                                ? post.subredditOrFeed ?? "Reddit"
                                : `@${post.authorHandle}`,
                              post.source === "reddit" ? "Reddit" : "Bluesky",
                              formatRelativeDate(post.postedAt),
                            ]}
                          />
                          <span className="flex items-center gap-1.5">
                            <span
                              className="inline-block size-2 rounded-full"
                              style={{
                                backgroundColor: sentimentColor(sentiment),
                              }}
                            />
                            <span className="text-[0.75rem] leading-[1rem] font-mono text-[var(--ink-500)]">
                              {sentiment > 0 ? "+" : ""}
                              {sentiment.toFixed(2)}
                            </span>
                          </span>
                        </div>
                      </article>
                    );
                  }

                  return (
                    <article
                      key={post.id}
                      className="py-6 border-t border-[var(--paper-200)]"
                    >
                      <blockquote
                        className="max-w-prose pl-5"
                        style={{
                          borderLeft: `2px solid ${sentimentColor(sentiment)}`,
                        }}
                      >
                        <p className="text-[1.125rem] leading-[1.75rem] text-[var(--ink-700)]">
                          {post.content}
                        </p>
                      </blockquote>
                      <div className="mt-3 pl-5 flex items-center gap-4">
                        <MetadataRow
                          items={[
                            post.source === "reddit"
                              ? post.subredditOrFeed ?? "Reddit"
                              : `@${post.authorHandle}`,
                            post.source === "reddit" ? "Reddit" : "Bluesky",
                            formatRelativeDate(post.postedAt),
                          ]}
                        />
                        <span className="flex items-center gap-1.5">
                          <span
                            className="inline-block size-2 rounded-full"
                            style={{
                              backgroundColor: sentimentColor(sentiment),
                            }}
                          />
                          <span className="text-[0.75rem] leading-[1rem] font-mono text-[var(--ink-500)]">
                            {sentiment > 0 ? "+" : ""}
                            {sentiment.toFixed(2)}
                          </span>
                        </span>
                      </div>
                    </article>
                  );
                })}

                {visiblePosts < postsList.length && (
                  <div className="pt-6 border-t border-[var(--paper-200)]">
                    <NaraButton
                      variant="ghost"
                      onClick={() => setVisiblePosts((n) => n + 8)}
                    >
                      Show more
                    </NaraButton>
                  </div>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
