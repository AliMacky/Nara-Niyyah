"use client";

import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";
import { sentimentColor } from "@/lib/design/sentiment-gradient";

export interface ThemeData {
  name: string;
  postCount: number;
  averageSentiment: number;
}

interface ThemeBreakdownProps extends ComponentPropsWithoutRef<"div"> {
  themes: ThemeData[];
}

function sentimentLabel(value: number): string {
  const abs = Math.abs(value);
  const direction = value < 0 ? "negative" : "positive";
  if (abs < 0.1) return "Neutral";
  if (abs < 0.3) return `Slightly ${direction}`;
  if (abs < 0.55) return `Moderately ${direction}`;
  if (abs < 0.8) return `Very ${direction}`;
  return `Extremely ${direction}`;
}

const ThemeBreakdown = forwardRef<HTMLDivElement, ThemeBreakdownProps>(
  ({ className, themes, ...props }, ref) => {
    if (themes.length === 0) return null;

    return (
      <div ref={ref} className={cn("", className)} {...props}>
        {/* Axis labels — shown once above the bars */}
        <div className="flex items-center gap-6 mb-2">
          <div className="shrink-0 w-[38%] min-w-0" />
          <div className="flex-1 flex justify-between">
            <span className="text-[0.75rem] font-medium uppercase tracking-wider text-[var(--ink-400)]">
              Negative
            </span>
            <span className="text-[0.75rem] font-medium uppercase tracking-wider text-[var(--ink-400)]">
              Positive
            </span>
          </div>
        </div>
        {themes.map((theme, i) => {
          // Map -1..1 → 0%..100% for marker position
          const pct =
            ((Math.max(-1, Math.min(1, theme.averageSentiment)) + 1) / 2) *
            100;
          const dotColor = sentimentColor(theme.averageSentiment);

          return (
            <div
              key={theme.name}
              className={cn(
                "flex items-center gap-6 py-6",
                i > 0 && "border-t border-[var(--paper-200)]",
              )}
            >
              {/* Left: theme name + count */}
              <div className="shrink-0 w-[38%] min-w-0">
                <p className="text-[1.125rem] leading-[1.75rem] text-[var(--ink-900)] truncate">
                  {theme.name}
                </p>
                <p className="text-[0.875rem] leading-[1.25rem] font-medium uppercase tracking-wider text-[var(--ink-500)] mt-0.5">
                  {theme.postCount} {theme.postCount === 1 ? "post" : "posts"}
                </p>
              </div>

              {/* Right: sentiment bar with marker + label */}
              <div className="flex-1 relative pb-6">
                <div
                  className="h-3 w-full rounded-full"
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
                <div
                  className="absolute top-0 -translate-x-1/2"
                  style={{ left: `${pct}%` }}
                >
                  <div
                    className={cn(
                      "size-5 rounded-full",
                      "border-[2.5px] border-[var(--paper-50)]",
                      "shadow-[0_0_0_1px_var(--ink-300)]",
                      "relative -top-1",
                    )}
                    style={{ backgroundColor: dotColor }}
                  />
                  <p className="text-[0.6875rem] leading-tight font-medium text-[var(--ink-500)] whitespace-nowrap -translate-x-1/4 mt-1">
                    {sentimentLabel(theme.averageSentiment)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  },
);
ThemeBreakdown.displayName = "ThemeBreakdown";

export { ThemeBreakdown };
export type { ThemeBreakdownProps };
