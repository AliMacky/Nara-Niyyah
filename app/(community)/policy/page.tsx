import Link from "next/link";
import { getPolicyFeed } from "@/server/policy/queries";
import type { PolicyFeedItem } from "@/server/policy/queries";
import { cn } from "@/lib/utils";
import { MessageSquare, Wand2, Plus } from "lucide-react";
import { UppercaseLabel, MetadataRow } from "@/components/nara";

const CATEGORIES: Array<{ value: PolicyFeedItem["category"] | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "housing", label: "Housing" },
  { value: "transit", label: "Transit" },
  { value: "environment", label: "Environment" },
  { value: "education", label: "Education" },
  { value: "public-safety", label: "Public Safety" },
  { value: "healthcare", label: "Healthcare" },
  { value: "economic-development", label: "Economic Dev." },
  { value: "civil-rights", label: "Civil Rights" },
];

const CATEGORY_LABELS: Record<PolicyFeedItem["category"], string> = {
  housing: "Housing",
  transit: "Transit",
  environment: "Environment",
  education: "Education",
  "public-safety": "Public Safety",
  healthcare: "Healthcare",
  "economic-development": "Economic Development",
  "civil-rights": "Civil Rights",
};

function PolicyCard({ draft, rank }: { draft: PolicyFeedItem; rank: number }) {
  return (
    <article
      className={cn(
        "py-8",
        rank > 0 && "border-t border-[var(--paper-200)]",
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <UppercaseLabel className="text-[var(--clay-600)]">
          {CATEGORY_LABELS[draft.category]}
        </UppercaseLabel>
        {draft.aiAssisted && (
          <span className="flex items-center gap-1 text-[0.75rem] text-[var(--ink-300)]">
            <Wand2 size={12} strokeWidth={1.75} aria-hidden />
            AI-assisted
          </span>
        )}
      </div>

      <h2
        className={cn(
          "mb-3 font-serif font-medium text-[var(--ink-900)]",
          rank === 0
            ? "text-[1.625rem] leading-[2.125rem]"
            : "text-[1.25rem] leading-[1.625rem]",
        )}
      >
        <Link
          href={`/policy/${draft.id}`}
          className="hover:text-[var(--clay-600)] transition-colors duration-[120ms] outline-none focus-visible:underline"
        >
          {draft.title}
        </Link>
      </h2>

      <p className="text-[1rem] leading-[1.625rem] text-[var(--ink-500)] mb-4 max-w-prose">
        {draft.summary}
      </p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <MetadataRow
          items={[
            `Anonymous citizen · ${draft.author.regionLabel}`,
            formatRelativeDate(draft.createdAt),
          ]}
        />
        <div className="flex items-center gap-4 text-[0.75rem] text-[var(--ink-300)]">
          {draft.votes.display && (
            <span>{draft.votes.display} in support</span>
          )}
          {draft.commentCount > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare size={12} strokeWidth={1.75} aria-hidden />
              {draft.commentCount}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export default async function PolicyFeedPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; region?: string; cursor?: string }>;
}) {
  const params = await searchParams;
  const region =
    params.region && params.region !== "All regions" ? params.region : undefined;
  const category = params.category && params.category !== "all" ? params.category : undefined;
  const cursor = params.cursor;

  const feed = await getPolicyFeed(region, category, cursor);

  function buildQuery(overrides: Record<string, string | undefined>) {
    const merged: Record<string, string> = {};
    if (region) merged.region = region;
    if (category) merged.category = category;
    if (cursor) merged.cursor = cursor;
    Object.entries(overrides).forEach(([k, v]) => {
      if (v === undefined) {
        delete merged[k];
      } else {
        merged[k] = v;
      }
    });
    const qs = new URLSearchParams(merged).toString();
    return qs ? `/policy?${qs}` : "/policy";
  }

  return (
    <div className="max-w-4xl mx-auto px-8 lg:px-12 py-12 md:py-16">
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="font-serif text-[2.5rem] leading-[2.75rem] font-medium tracking-tight text-[var(--ink-900)]">
            Policy proposals
          </h1>
          <p className="mt-2 text-[1rem] leading-[1.625rem] text-[var(--ink-500)] max-w-prose">
            {feed.total} proposal{feed.total !== 1 ? "s" : ""} from citizens across your region.
            All submissions are anonymous and community-reviewed.
          </p>
        </div>
        <Link
          href="/policy/new"
          className={cn(
            "shrink-0 inline-flex items-center gap-1.5",
            "bg-[var(--clay-600)] text-[var(--paper-50)]",
            "border border-[var(--clay-600)]",
            "text-[0.875rem] leading-[1.25rem] font-medium",
            "rounded-md px-4 py-2.5",
            "hover:bg-[var(--clay-500)]",
            "outline-none focus-visible:ring-2 focus-visible:ring-[var(--clay-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper-50)]",
            "transition-colors duration-[120ms]",
          )}
        >
          <Plus size={16} strokeWidth={1.75} />
          New proposal
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-8" role="group" aria-label="Filter by category">
        {CATEGORIES.map((cat) => {
          const active = (category ?? "all") === cat.value;
          return (
            <Link
              key={cat.value}
              href={buildQuery({
                category: cat.value !== "all" ? cat.value : undefined,
                cursor: undefined,
              })}
              aria-current={active ? "true" : undefined}
              className={cn(
                "text-[0.8125rem] font-medium px-3 py-1 rounded-full",
                "border transition-colors duration-[120ms]",
                "outline-none focus-visible:ring-2 focus-visible:ring-[var(--clay-500)]",
                active
                  ? "bg-[var(--clay-600)] text-[var(--paper-50)] border-[var(--clay-600)]"
                  : "border-[var(--paper-300)] text-[var(--ink-500)] hover:border-[var(--ink-700)] hover:text-[var(--ink-900)]",
              )}
            >
              {cat.label}
            </Link>
          );
        })}
      </div>

      {feed.items.length === 0 ? (
        <p className="text-[var(--ink-300)] py-20 text-center text-[1rem]">
          No proposals in this category yet.
        </p>
      ) : (
        <div>
          {feed.items.map((draft, i) => (
            <PolicyCard key={draft.id} draft={draft} rank={i} />
          ))}
        </div>
      )}

      {feed.nextCursor && (
        <div className="pt-8 border-t border-[var(--paper-200)]">
          <Link
            href={buildQuery({ cursor: feed.nextCursor })}
            className="text-[0.875rem] font-medium text-[var(--ink-700)] hover:underline"
          >
            Load more proposals
          </Link>
        </div>
      )}
    </div>
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
