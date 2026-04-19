/**
 * UppercaseLabel — small section tag / category label.
 *
 * Usage:
 *   <UppercaseLabel>Housing</UppercaseLabel>
 *   <UppercaseLabel as="span">Environment</UppercaseLabel>
 *
 * Spec: DESIGN_SYSTEM.md § Typography rules
 * - body-xs with tracking-wider uppercase
 * - Used for section tags, region names, sentiment labels
 */

import { forwardRef, type ComponentPropsWithoutRef, type ElementType } from "react";

import { cn } from "@/lib/utils";

interface UppercaseLabelProps extends ComponentPropsWithoutRef<"span"> {
  as?: ElementType;
}

const UppercaseLabel = forwardRef<HTMLSpanElement, UppercaseLabelProps>(
  ({ className, as: Tag = "span", ...props }, ref) => {
    return (
      <Tag
        ref={ref}
        className={cn(
          "text-[0.75rem] leading-[1rem] font-medium uppercase tracking-wider",
          "text-[var(--ink-500)]",
          className,
        )}
        {...props}
      />
    );
  },
);
UppercaseLabel.displayName = "UppercaseLabel";

export { UppercaseLabel };
export type { UppercaseLabelProps };
