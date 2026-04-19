/**
 * PlatformFilter — quiet platform source filter.
 *
 * Usage:
 *   <PlatformFilter value="all" onChange={setPlatform} />
 *
 * Spec: DESIGN_SYSTEM.md § Platform filtering
 * - body-xs uppercase labels: All · Reddit · X · Instagram
 * - Active: underline in clay
 * - Hover: underline in ink-300
 * - Same visual pattern as TimeRangeToggle
 */

"use client";

import { forwardRef, type ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

const OPTIONS = ["all", "reddit", "x", "instagram"] as const;
type PlatformValue = (typeof OPTIONS)[number];

const DISPLAY_LABELS: Record<PlatformValue, string> = {
  all: "All sources",
  reddit: "Reddit",
  x: "X",
  instagram: "Instagram",
};

interface PlatformFilterProps
  extends Omit<ComponentPropsWithoutRef<"div">, "onChange"> {
  value: PlatformValue;
  onChange: (value: PlatformValue) => void;
}

const PlatformFilter = forwardRef<HTMLDivElement, PlatformFilterProps>(
  ({ className, value, onChange, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="radiogroup"
        aria-label="Platform filter"
        className={cn("flex items-center gap-4", className)}
        {...props}
      >
        {OPTIONS.map((opt) => {
          const active = opt === value;
          return (
            <button
              key={opt}
              role="radio"
              aria-checked={active}
              onClick={() => onChange(opt)}
              className={cn(
                "text-[0.75rem] leading-[1rem] font-medium uppercase tracking-wider",
                "pb-0.5 border-b-2 transition-colors duration-[120ms]",
                "outline-none focus-visible:ring-2 focus-visible:ring-[var(--clay-500)] focus-visible:rounded-sm",
                active
                  ? "text-[var(--ink-900)] border-[var(--clay-600)]"
                  : "text-[var(--ink-500)] border-transparent hover:border-[var(--ink-300)]",
              )}
            >
              {DISPLAY_LABELS[opt]}
            </button>
          );
        })}
      </div>
    );
  },
);
PlatformFilter.displayName = "PlatformFilter";

export { PlatformFilter, OPTIONS as PLATFORM_OPTIONS };
export type { PlatformFilterProps, PlatformValue };
