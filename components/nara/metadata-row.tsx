/**
 * MetadataRow — uppercase body-xs inline row with bullet separators.
 *
 * Usage:
 *   <MetadataRow items={["King County, WA", "Apr 3–10, 2026", "Reddit · X"]} />
 *
 * Spec: DESIGN_SYSTEM.md § Campaign detail, Policy feed
 * - body-xs uppercase, ink-500
 * - Bullet (·) separators between items
 */

import { forwardRef, type ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

interface MetadataRowProps extends ComponentPropsWithoutRef<"div"> {
  items: string[];
}

const MetadataRow = forwardRef<HTMLDivElement, MetadataRowProps>(
  ({ className, items, ...props }, ref) => {
    if (items.length === 0) return null;

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-wrap items-center gap-x-2 gap-y-1",
          "text-[0.75rem] leading-[1rem] font-medium uppercase tracking-wider",
          "text-[var(--ink-500)]",
          className,
        )}
        {...props}
      >
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && (
              <span aria-hidden="true" className="text-[var(--ink-300)]">
                ·
              </span>
            )}
            {item}
          </span>
        ))}
      </div>
    );
  },
);
MetadataRow.displayName = "MetadataRow";

export { MetadataRow };
export type { MetadataRowProps };
