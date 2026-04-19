/**
 * SentimentBar — horizontal gradient bar with position marker.
 *
 * Usage:
 *   <SentimentBar value={0.34} />
 *   <SentimentBar value={-0.6} uncertain />
 *
 * Spec: DESIGN_SYSTEM.md § Sentiment spectrum
 * - Gradient: neg-strong → neg-soft → neutral → pos-soft → pos-strong
 * - Always interpolates through neutral in the middle
 * - When uncertain: desaturate 40%
 * - Value range: -1 (full negative) to 1 (full positive)
 */

import { forwardRef, type ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

interface SentimentBarProps extends ComponentPropsWithoutRef<"div"> {
  /** Sentiment value from -1 (negative) to 1 (positive). */
  value: number;
  /** Desaturate bar when confidence is low. */
  uncertain?: boolean;
}

const SentimentBar = forwardRef<HTMLDivElement, SentimentBarProps>(
  ({ className, value, uncertain, ...props }, ref) => {
    // Map -1..1 → 0%..100%
    const pct = ((Math.max(-1, Math.min(1, value)) + 1) / 2) * 100;

    return (
      <div
        ref={ref}
        role="img"
        aria-label={`Sentiment: ${value > 0 ? "+" : ""}${value.toFixed(2)}`}
        className={cn("relative w-full", className)}
        {...props}
      >
        <div className="relative">
          {/* Gradient track */}
          <div
            className={cn(
              "h-3 w-full rounded-full",
              uncertain && "opacity-60 saturate-[0.6]",
            )}
            style={{
              background: [
                "linear-gradient(to right,",
                "var(--sentiment-neg-strong) 0%,",
                "var(--sentiment-neg-soft) 25%,",
                "var(--sentiment-neutral) 50%,",
                "var(--sentiment-pos-soft) 75%,",
                "var(--sentiment-pos-strong) 100%)",
              ].join(" "),
            }}
          />

          {/* Marker */}
          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${pct}%` }}
          >
            <div
              className={cn(
                "size-5 rounded-full",
                "border-[2.5px] border-[var(--paper-50)]",
                "bg-[var(--ink-900)]",
                "shadow-[0_0_0_1px_var(--ink-300)]",
              )}
            />
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between font-mono text-[0.875rem] leading-[1rem] text-[var(--ink-500)]">
          <span>-1</span>
          <span>1</span>
        </div>
      </div>
    );
  },
);
SentimentBar.displayName = "SentimentBar";

export { SentimentBar };
export type { SentimentBarProps };
