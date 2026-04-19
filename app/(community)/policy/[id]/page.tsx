import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Wand2, MessageSquare } from "lucide-react";

import { getPolicyDraft, getComments } from "@/server/policy/queries";
import type { PolicyDraft, Comment } from "@/server/policy/queries";
import { cn } from "@/lib/utils";
import { UppercaseLabel, MetadataRow } from "@/components/nara";
import { VoteButton } from "./_components/vote-button";
import { CommentForm } from "./_components/comment-form";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<PolicyDraft["category"], string> = {
  housing: "Housing",
  transit: "Transit",
  environment: "Environment",
  education: "Education",
  "public-safety": "Public Safety",
  healthcare: "Healthcare",
  "economic-development": "Economic Development",
  "civil-rights": "Civil Rights",
};

// ---------------------------------------------------------------------------
// Comment item
// ---------------------------------------------------------------------------

function CommentItem({ comment, rank }: { comment: Comment; rank: number }) {
  return (
    <div
      className={cn(
        "py-5",
        rank > 0 && "border-t border-[var(--paper-200)]",
      )}
    >
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <MetadataRow
          items={[
            comment.isPolitician
              ? "Verified representative"
              : `Anonymous citizen · ${comment.author.regionLabel}`,
            formatRelativeDate(comment.createdAt),
          ]}
        />
        {comment.isPolitician && (
          <span className="text-[0.6875rem] font-medium uppercase tracking-wider text-[var(--clay-600)] border border-[var(--clay-400)] rounded px-1.5 py-0.5">
            Official
          </span>
        )}
      </div>
      <p className="text-[0.9375rem] leading-[1.5625rem] text-[var(--ink-700)] max-w-prose">
        {comment.text}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page — server component
// ---------------------------------------------------------------------------

export default async function PolicyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [draft, comments] = await Promise.all([
    getPolicyDraft(id),
    getComments(id),
  ]);

  if (!draft) notFound();

  // Body paragraphs — split on double newlines for readability
  const sections = draft.body.split("\n\n").filter(Boolean);

  return (
    <div className="max-w-4xl mx-auto px-8 lg:px-12 py-12 md:py-16">
      {/* Back navigation */}
      <div className="mb-8">
        <Link
          href="/policy"
          className={cn(
            "inline-flex items-center gap-1.5",
            "text-[0.875rem] text-[var(--ink-500)]",
            "hover:text-[var(--ink-900)] transition-colors duration-[120ms]",
            "outline-none focus-visible:underline",
          )}
        >
          <ChevronLeft size={16} strokeWidth={1.75} aria-hidden />
          All proposals
        </Link>
      </div>

      {/* Category + AI indicator */}
      <div className="flex items-center justify-between mb-4">
        <UppercaseLabel className="text-[var(--clay-600)]">
          {CATEGORY_LABELS[draft.category]}
        </UppercaseLabel>
        {draft.aiAssisted && (
          <span className="flex items-center gap-1.5 text-[0.75rem] text-[var(--ink-300)]">
            <Wand2 size={12} strokeWidth={1.75} aria-hidden />
            AI-assisted draft
          </span>
        )}
      </div>

      {/* Title */}
      <h1 className="font-serif text-[2rem] leading-[2.5rem] font-medium text-[var(--ink-900)] mb-4">
        {draft.title}
      </h1>

      {/* Author + date metadata */}
      <div className="mb-2">
        <MetadataRow
          items={[
            `Anonymous citizen · ${draft.author.regionLabel}`,
            formatRelativeDate(draft.createdAt),
            draft.region,
          ]}
        />
      </div>

      {/* Engagement stats — votes use threshold display, never raw count */}
      <div className="flex items-center gap-4 mb-8 text-[0.8125rem] text-[var(--ink-300)]">
        {draft.votes.display ? (
          <span>{draft.votes.display} in support</span>
        ) : (
          <span>Be the first to support this proposal</span>
        )}
        {draft.commentCount > 0 && (
          <span className="flex items-center gap-1">
            <MessageSquare size={13} strokeWidth={1.75} aria-hidden />
            {draft.commentCount} {draft.commentCount === 1 ? "response" : "responses"}
          </span>
        )}
      </div>

      {/* Short rule + summary */}
      <div className="w-16 h-px bg-[var(--paper-300)] mb-6" />
      <p className="text-[1.125rem] leading-[1.875rem] text-[var(--ink-700)] font-medium mb-8 max-w-prose">
        {draft.summary}
      </p>

      {/* Full policy body — rendered as readable sections */}
      <div className="mb-10 max-w-prose">
        {sections.map((section, i) => {
          const isHeading = section.startsWith("Section");
          return (
            <p
              key={i}
              className={cn(
                "mb-4 last:mb-0",
                isHeading
                  ? "text-[0.875rem] font-medium uppercase tracking-wide text-[var(--ink-500)] mt-6 first:mt-0"
                  : "text-[1rem] leading-[1.75rem] text-[var(--ink-700)]",
              )}
            >
              {section}
            </p>
          );
        })}
      </div>

      {/* Support CTA — VoteButton is the client island */}
      <div className="border border-[var(--paper-300)] rounded-md p-5 mb-10 flex items-center justify-between gap-4 bg-[var(--paper-100)]">
        <div>
          <p className="text-[0.9375rem] font-medium text-[var(--ink-900)] mb-1">
            Support this proposal
          </p>
          <p className="text-[0.8125rem] text-[var(--ink-500)] max-w-xs">
            Adding your voice signals constituent demand to local representatives.
            Your identity remains protected.
          </p>
        </div>
        <VoteButton draftId={draft.id} />
      </div>

      {/* Comments / responses */}
      <section aria-label="Community responses">
        {comments.length > 0 && (
          <>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-16 h-px bg-[var(--paper-300)]" />
              <UppercaseLabel>
                {comments.length} {comments.length === 1 ? "response" : "responses"}
              </UppercaseLabel>
            </div>
            {comments.map((c, i) => (
              <CommentItem key={c.id} comment={c} rank={i} />
            ))}
          </>
        )}
        {/* Comment form is always shown — CommentForm handles the empty-state label */}
        <CommentForm draftId={draft.id} />
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Not found
// ---------------------------------------------------------------------------

export function generateStaticParams() {
  return [];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
