/**
 * SentimentDistribution — horizontal stacked bar (archetype #3).
 *
 * Usage:
 *   <SentimentDistribution negative={23} neutral={45} positive={32} />
 *
 * Spec: DESIGN_SYSTEM.md § Sentiment chart archetypes #3
 * - Single horizontal stacked bar, full width
 * - Segments: negative / neutral / positive, colored from sentiment spectrum
 * - 2px paper-50 gaps between segments (not borders — carved from paper)
 * - Counts labeled inside each segment if width > 8%, otherwise on hover
 * - Never a pie or donut
 */

"use client";

import { forwardRef, useState, type ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";
import { resolvedColors } from "@/lib/design/tokens";

interface SentimentDistributionProps extends ComponentPropsWithoutRef<"div"> {
  negative: number;
  neutral: number;
  positive: number;
}

interface Segment {
  label: string;
  count: number;
  pct: number;
  color: string;
}

const SentimentDistribution = forwardRef<
  HTMLDivElement,
  SentimentDistributionProps
>(({ className, negative, neutral, positive, ...props }, ref) => {
  const total = negative + neutral + positive;
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (total === 0) return null;

  const c = resolvedColors.light.sentiment;
  const segments: Segment[] = [
    { label: "Negative", count: negative, pct: (negative / total) * 100, color: c.negSoft },
    { label: "Neutral", count: neutral, pct: (neutral / total) * 100, color: c.neutral },
    { label: "Positive", count: positive, pct: (positive / total) * 100, color: c.posSoft },
  ].filter((s) => s.count > 0);

  return (
    <div ref={ref} className={cn("w-full", className)} {...props}>
      {/* Bar */}
      <div
        className="flex h-10 w-full overflow-hidden rounded-md"
        role="img"
        aria-label={`Sentiment distribution: ${negative} negative, ${neutral} neutral, ${positive} positive`}
      >
        {segments.map((seg, i) => (
          <div
            key={seg.label}
            className="relative flex items-center justify-center transition-opacity duration-150"
            style={{
              width: `calc(${seg.pct}% - ${i > 0 ? 2 : 0}px)`,
              marginLeft: i > 0 ? 2 : 0,
              backgroundColor: seg.color,
            }}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {/* Inline label if segment > 8% */}
            {seg.pct > 8 && (
              <span className="text-[0.75rem] leading-[1rem] font-medium text-[var(--paper-50)] mix-blend-luminosity">
                {seg.count.toLocaleString()}
              </span>
            )}

            {/* Hover tooltip for narrow segments */}
            {seg.pct <= 8 && hoveredIdx === i && (
              <div
                className={cn(
                  "absolute -top-10 left-1/2 -translate-x-1/2",
                  "bg-[var(--paper-100)] border border-[var(--paper-300)]",
                  "rounded px-2 py-1 whitespace-nowrap z-10",
                  "text-[0.75rem] leading-[1rem] text-[var(--ink-700)]",
                )}
              >
                {seg.label}: {seg.count.toLocaleString()}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend row */}
      <div className="mt-3 flex items-center gap-6">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <div
              className="size-2.5 rounded-full"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-[0.75rem] leading-[1rem] font-medium uppercase tracking-wider text-[var(--ink-500)]">
              {seg.label} {Math.round(seg.pct)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});
SentimentDistribution.displayName = "SentimentDistribution";

export { SentimentDistribution };
export type { SentimentDistributionProps };
