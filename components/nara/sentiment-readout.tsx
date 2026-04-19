/**
 * SentimentReadout — the most important component in the app.
 *
 * Usage:
 *   <SentimentReadout
 *     value={0.34}
 *     sampleSize={1247}
 *     confidence={0.87}
 *     timeRange={{ start: "2026-04-03T00:00:00Z", end: "2026-04-10T00:00:00Z" }}
 *   />
 *
 * Spec: DESIGN_SYSTEM.md § Sentiment readout component
 * Always renders all five elements:
 * 1. Sentiment value in display-sm Fraunces
 * 2. Gradient bar with marker (SentimentBar)
 * 3. Sample size in body-sm
 * 4. Confidence chip if < 70% or n < 30 (body-xs)
 * 5. Time range in body-xs uppercase
 *
 * Never show a sentiment value without all five elements.
 */

"use client";

import { forwardRef, type ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";
import { SentimentBar } from "./sentiment-bar";

interface SentimentReadoutProps extends ComponentPropsWithoutRef<"div"> {
  value: number;
  sampleSize: number;
  confidence: number;
  timeRange: { start: string; end: string };
}

function formatSentimentLabel(value: number): { number: string; label: string } {
  const abs = Math.abs(value);
  const formatted = abs.toFixed(2);

  if (abs < 0.05) return { number: formatted, label: "neutral" };
  if (value > 0) return { number: formatted, label: "positive" };
  return { number: formatted, label: "negative" };
}

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

function formatSampleSize(n: number): string {
  if (n >= 1000) {
    return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  }
  return n.toLocaleString("en-US");
}

const SentimentReadout = forwardRef<HTMLDivElement, SentimentReadoutProps>(
  ({ className, value, sampleSize, confidence, timeRange, ...props }, ref) => {
    const { number: sentimentNumber, label: sentimentLabel } =
      formatSentimentLabel(value);
    const isUncertain = confidence < 0.7 || sampleSize < 30;

    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-4", className)}
        {...props}
      >
        {/* 1. Sentiment value — display-sm Fraunces */}
        <div className="font-serif text-[1.75rem] leading-[2rem] font-medium text-[var(--ink-900)]">
          <span>{sentimentNumber}</span>{" "}
          <span className="text-[var(--ink-500)]">{sentimentLabel}</span>
        </div>

        {/* 2. Gradient bar with marker */}
        <SentimentBar value={value} uncertain={isUncertain} />

        {/* 3–5. Metadata row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {/* 3. Sample size */}
          <span className="text-[0.875rem] leading-[1.25rem] text-[var(--ink-700)]">
            from {formatSampleSize(sampleSize)} posts
          </span>

          {/* 4. Confidence chip (conditional) */}
          {isUncertain && (
            <span
              className={cn(
                "inline-flex items-center gap-1",
                "rounded-full px-2.5 py-0.5",
                "bg-[var(--paper-200)] text-[var(--ink-700)]",
                "text-[0.75rem] leading-[1rem] font-medium",
              )}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden="true"
                className="shrink-0"
              >
                <path
                  d="M6 1.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9zM6 4v2.5M6 8h.005"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {confidence < 0.7 && sampleSize >= 30
                ? `${Math.round(confidence * 100)}% confidence`
                : sampleSize < 30
                  ? `n = ${sampleSize}`
                  : `${Math.round(confidence * 100)}% · n = ${sampleSize}`}
            </span>
          )}

          {/* 5. Time range */}
          <span className="text-[0.75rem] leading-[1rem] font-medium uppercase tracking-wider text-[var(--ink-500)]">
            {formatDateRange(timeRange.start, timeRange.end)}
          </span>
        </div>
      </div>
    );
  },
);
SentimentReadout.displayName = "SentimentReadout";

export { SentimentReadout };
export type { SentimentReadoutProps };
