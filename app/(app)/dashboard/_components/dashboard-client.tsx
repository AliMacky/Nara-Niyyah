"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Search, MapPin, ChevronDown } from "lucide-react";

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
import { submitSearch } from "@/server/search/actions";

// ---------------------------------------------------------------------------
// Types for poll response
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

interface SearchPollData {
  id: string;
  term: string;
  locationScope: string | null;
  status:
    | "pending"
    | "scraping"
    | "analyzing"
    | "extracting_themes"
    | "complete"
    | "failed";
  createdAt: string;
  completedAt: string | null;
  postCount?: number;
  aggregate?: AggregateData;
  posts?: PostData[];
  themes?: ThemeData[];
}

// ---------------------------------------------------------------------------
// Props — initial data from server component
// ---------------------------------------------------------------------------

export interface DashboardClientProps {
  initialSearch: SearchPollData | null;
}

// ---------------------------------------------------------------------------
// Location options
// ---------------------------------------------------------------------------

const LOCATIONS = [
  { label: "Everywhere", value: undefined },
  { label: "Washington", value: "Washington" },
  { label: "California", value: "California" },
  { label: "Oregon", value: "Oregon" },
] as const;

// ---------------------------------------------------------------------------
// Section divider
// ---------------------------------------------------------------------------

function SectionHeader({ children }: { children: string }) {
  return (
    <div>
      <div className="w-16 h-px bg-[var(--paper-300)] mb-3" />
      <UppercaseLabel className="block">{children}</UppercaseLabel>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status label for in-progress searches
// ---------------------------------------------------------------------------

function StatusIndicator({
  status,
  postCount,
}: {
  status: string;
  postCount?: number;
}) {
  const labels: Record<string, string> = {
    pending: "STARTING SEARCH…",
    scraping: "SCRAPING POSTS…",
    analyzing: postCount
      ? `ANALYZING ${postCount} POSTS…`
      : "ANALYZING POSTS…",
    extracting_themes: "EXTRACTING THEMES…",
  };
  return (
    <div className="py-10">
      <span className="text-[0.75rem] leading-[1rem] font-medium uppercase tracking-wider text-[var(--ink-500)]">
        {labels[status] ?? status.toUpperCase()}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function DashboardClient({
  initialSearch,
}: DashboardClientProps) {
  const [term, setTerm] = useState("");
  const [locationIdx, setLocationIdx] = useState(0);
  const [locationOpen, setLocationOpen] = useState(false);
  const [visiblePosts, setVisiblePosts] = useState(8);

  // Search state
  const [searchData, setSearchData] = useState<SearchPollData | null>(
    initialSearch,
  );
  const [submitting, setSubmitting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const location = LOCATIONS[locationIdx];

  // ----- Polling -----
  const startPolling = useCallback((searchId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/searches/${searchId}`);
        if (!res.ok) return;
        const data: SearchPollData = await res.json();
        setSearchData(data);

        if (data.status === "complete" || data.status === "failed") {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch {
        // Network error — keep polling
      }
    }, 2000);
  }, []);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // ----- Submit -----
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const q = term.trim();
      if (!q) return;

      setSubmitting(true);
      setVisiblePosts(8);
      setSearchData(null);

      try {
        const { searchId, cached } = await submitSearch(q, location.value);
        if (cached) {
          const res = await fetch(`/api/searches/${searchId}`);
          if (res.ok) {
            const data: SearchPollData = await res.json();
            setSearchData(data);
            if (data.status !== "complete" && data.status !== "failed") {
              startPolling(searchId);
            }
          }
        } else {
          setSearchData({
            id: searchId,
            term: q,
            locationScope: location.value ?? null,
            status: "pending",
            createdAt: new Date().toISOString(),
            completedAt: null,
          });
          startPolling(searchId);
        }
      } catch (err) {
        console.error("Submit failed:", err);
      } finally {
        setSubmitting(false);
      }
    },
    [term, location.value, startPolling],
  );

  // ----- Derived data -----
  const isInProgress =
    searchData &&
    (searchData.status === "pending" ||
      searchData.status === "scraping" ||
      searchData.status === "analyzing" ||
      searchData.status === "extracting_themes");

  const isComplete = searchData?.status === "complete";
  const isFailed = searchData?.status === "failed";
  const aggregate = searchData?.aggregate;
  const themes = searchData?.themes ?? [];

  // Filter out irrelevant posts (confidence = 0) and sort:
  // most recent first, with highest confidence breaking ties
  const postsList = (searchData?.posts ?? [])
    .filter((p) => p.confidence === null || p.confidence > 0)
    .sort((a, b) => {
      const timeDiff =
        new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
      if (Math.abs(timeDiff) > 86400000) return timeDiff;
      return (b.confidence ?? 0) - (a.confidence ?? 0);
    });

  // Distribution
  const distribution = aggregate
    ? {
        neg: aggregate.negativeCount,
        neut: aggregate.neutralCount,
        pos: aggregate.positiveCount,
      }
    : { neg: 0, neut: 0, pos: 0 };

  // Time range for readout
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
      {/* ==================================================================
         Search hero
         ================================================================== */}
      <section>
        <h1
          className={cn(
            "font-serif text-[2.5rem] leading-[2.75rem] font-medium tracking-tight",
            "text-[var(--ink-900)]",
          )}
        >
          What are people saying about&hellip;
        </h1>

        <form onSubmit={handleSubmit} className="mt-8">
          <div className="relative flex items-end gap-3">
            <div className="flex-1 relative">
              <label htmlFor="search-term" className="sr-only">
                Search term
              </label>
              <input
                id="search-term"
                type="text"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="housing policy, transit funding, Palestine…"
                disabled={submitting}
                className={cn(
                  "w-full bg-transparent",
                  "text-[1.125rem] leading-[1.75rem] text-[var(--ink-900)]",
                  "placeholder:text-[var(--ink-300)]",
                  "border-0 border-b-2 border-[var(--paper-300)]",
                  "py-3 pr-10",
                  "outline-none",
                  "focus:border-[var(--clay-500)]",
                  "transition-colors duration-150",
                  "disabled:opacity-50",
                )}
              />
              <Search
                size={18}
                strokeWidth={1.75}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--ink-300)]"
                aria-hidden
              />
            </div>

            {/* Location scope chip */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setLocationOpen(!locationOpen)}
                className={cn(
                  "flex items-center gap-1.5",
                  "text-[0.875rem] leading-[1.25rem] font-medium",
                  "text-[var(--ink-500)]",
                  "border border-[var(--paper-300)] rounded-md",
                  "px-3 py-2.5",
                  "hover:border-[var(--ink-500)]",
                  "outline-none focus-visible:ring-2 focus-visible:ring-[var(--clay-500)]",
                  "transition-colors duration-120",
                )}
                aria-expanded={locationOpen}
                aria-haspopup="listbox"
              >
                <MapPin size={14} strokeWidth={1.75} />
                <span>
                  {location.label === "Everywhere"
                    ? "Everywhere"
                    : `in ${location.label}`}
                </span>
                <ChevronDown size={14} strokeWidth={1.75} />
              </button>

              {locationOpen && (
                <div
                  className={cn(
                    "absolute right-0 top-full mt-1 z-30",
                    "bg-[var(--paper-100)] border border-[var(--paper-300)] rounded-md",
                    "py-1 min-w-[160px]",
                  )}
                  role="listbox"
                >
                  {LOCATIONS.map((loc, i) => (
                    <button
                      key={loc.label}
                      role="option"
                      aria-selected={i === locationIdx}
                      className={cn(
                        "block w-full text-left px-3 py-2",
                        "text-[0.875rem] leading-[1.25rem]",
                        i === locationIdx
                          ? "font-medium text-[var(--ink-900)]"
                          : "text-[var(--ink-500)] hover:text-[var(--ink-900)] hover:bg-[var(--paper-200)]",
                        "transition-colors duration-100",
                      )}
                      onClick={() => {
                        setLocationIdx(i);
                        setLocationOpen(false);
                      }}
                    >
                      {loc.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </form>
      </section>

      {/* ==================================================================
         In-progress indicator
         ================================================================== */}
      {isInProgress && (
        <StatusIndicator
          status={searchData.status}
          postCount={searchData.postCount}
        />
      )}

      {/* ==================================================================
         Failed state
         ================================================================== */}
      {isFailed && (
        <p className="text-[var(--sentiment-neg-strong)] text-[0.875rem] leading-[1.25rem] py-10">
          Search failed. Try again.
        </p>
      )}

      {/* ==================================================================
         Results — readout → themes → distribution → posts
         ================================================================== */}
      {isComplete && aggregate && (
        <>
          {/* Context metadata */}
          <section className="pt-10">
            <MetadataRow
              items={[
                searchData.term,
                ...(searchData.locationScope
                  ? [searchData.locationScope]
                  : []),
                formatDateRange(timeRange.start, timeRange.end),
              ].filter(Boolean)}
            />
          </section>

          {/* Sentiment readout */}
          <section className="pt-6 pb-10">
            <SentimentReadout
              value={aggregate.meanSentiment}
              sampleSize={aggregate.totalPosts}
              confidence={aggregate.confidence}
              timeRange={timeRange}
            />
          </section>

          {/* Themes */}
          {themes.length > 0 && (
            <section className="pb-10">
              <SectionHeader>Themes</SectionHeader>
              <div className="mt-4">
                <ThemeBreakdown themes={themes} />
              </div>
            </section>
          )}

          {/* Distribution */}
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

          {/* Posts */}
          {postsList.length > 0 && (
            <section>
              <SectionHeader>Recent posts</SectionHeader>
              <div className="mt-4">
                <PostsList
                  posts={postsList.slice(0, visiblePosts)}
                  hasMore={visiblePosts < postsList.length}
                  onLoadMore={() => setVisiblePosts((n) => n + 8)}
                />
              </div>
            </section>
          )}
        </>
      )}

      {/* Empty state */}
      {!searchData && !submitting && (
        <p className="text-[var(--ink-300)] text-[1.125rem] leading-[1.75rem] py-10">
          Search for a topic above to see what people are saying.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Posts list
// ---------------------------------------------------------------------------

function PostsList({
  posts,
  hasMore,
  onLoadMore,
}: {
  posts: PostData[];
  hasMore: boolean;
  onLoadMore: () => void;
}) {
  return (
    <div>
      {posts.map((post, i) => {
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
                    style={{ backgroundColor: sentimentColor(sentiment) }}
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
            className={cn("py-6", "border-t border-[var(--paper-200)]")}
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
                  style={{ backgroundColor: sentimentColor(sentiment) }}
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

      {hasMore && (
        <div className="pt-6 border-t border-[var(--paper-200)]">
          <NaraButton variant="ghost" onClick={onLoadMore}>
            Show more
          </NaraButton>
          <div className="mt-6 w-full h-px bg-[var(--paper-200)]" />
        </div>
      )}
    </div>
  );
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
  return `${fmt.format(s)}–${fmt.format(e)}, ${yearFmt.format(e)}`;
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
