/**
 * TimeRangeToggle — quiet time range selector.
 *
 * Usage:
 *   <TimeRangeToggle value="1M" onChange={setRange} />
 *
 * Spec: DESIGN_SYSTEM.md § Time range controls
 * - body-xs uppercase labels: 1W · 1M · 3M · 1Y · All
 * - Active: underline in clay
 * - Hover: underline in ink-300
 * - No button group chrome, no pill background
 */

"use client";

import { forwardRef, type ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

const OPTIONS = ["1W", "1M", "3M", "1Y", "All"] as const;
type TimeRangeValue = (typeof OPTIONS)[number];

interface TimeRangeToggleProps
  extends Omit<ComponentPropsWithoutRef<"div">, "onChange"> {
  value: TimeRangeValue;
  onChange: (value: TimeRangeValue) => void;
}

const TimeRangeToggle = forwardRef<HTMLDivElement, TimeRangeToggleProps>(
  ({ className, value, onChange, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="radiogroup"
        aria-label="Time range"
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
              {opt}
            </button>
          );
        })}
      </div>
    );
  },
);
TimeRangeToggle.displayName = "TimeRangeToggle";

export { TimeRangeToggle, OPTIONS as TIME_RANGE_OPTIONS };
export type { TimeRangeToggleProps, TimeRangeValue };
