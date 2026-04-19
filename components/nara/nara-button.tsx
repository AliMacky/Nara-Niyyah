/**
 * NaraButton — primary, secondary, ghost variants.
 *
 * Usage:
 *   <NaraButton variant="primary">Save campaign</NaraButton>
 *   <NaraButton variant="secondary">Cancel</NaraButton>
 *   <NaraButton variant="ghost">Learn more</NaraButton>
 *
 * Spec: DESIGN_SYSTEM.md § Buttons
 * - Primary: clay bg, paper-50 text, 1px clay-600 border, rounded-md
 * - Secondary: transparent bg, 1px ink-900 border, ink-900 text
 * - Ghost: no border, ink-700 text, underline on hover
 * - All: body-sm weight-500, px-5 py-2.5, ease-snap 120ms
 */

import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

const naraButtonVariants = cva(
  [
    "inline-flex items-center justify-center",
    "text-[0.875rem] leading-[1.25rem] font-medium",
    "px-5 py-2.5 rounded-md",
    "transition-colors duration-[120ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
    "outline-none select-none whitespace-nowrap",
    "focus-visible:ring-2 focus-visible:ring-[var(--clay-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper-50)]",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[18px]",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: [
          "bg-[var(--clay-600)] text-[var(--paper-50)]",
          "border border-[var(--clay-600)]",
          "hover:bg-[var(--clay-500)]",
          "active:bg-[var(--clay-600)]",
        ].join(" "),
        secondary: [
          "bg-transparent text-[var(--ink-900)]",
          "border border-[var(--ink-900)]",
          "hover:bg-[var(--paper-100)]",
          "active:bg-[var(--paper-200)]",
        ].join(" "),
        ghost: [
          "bg-transparent text-[var(--ink-700)]",
          "border border-transparent",
          "hover:underline hover:text-[var(--ink-900)]",
          "active:text-[var(--ink-900)]",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

type NaraButtonVariants = VariantProps<typeof naraButtonVariants>;

interface NaraButtonProps
  extends ComponentPropsWithoutRef<"button">,
    NaraButtonVariants {}

const NaraButton = forwardRef<HTMLButtonElement, NaraButtonProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(naraButtonVariants({ variant, className }))}
        {...props}
      />
    );
  },
);
NaraButton.displayName = "NaraButton";

export { NaraButton, naraButtonVariants };
export type { NaraButtonProps };
