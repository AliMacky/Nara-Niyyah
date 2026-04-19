/**
 * Surface — Nara's card replacement.
 *
 * Usage:
 *   <Surface>Content here</Surface>
 *   <Surface asLink href="/campaigns/1">Clickable card</Surface>
 *
 * Spec: DESIGN_SYSTEM.md § Cards / surfaces
 * - Paper-100 bg, 1px paper-300 border, no shadow
 * - Link variant: border shifts to ink-700 on hover, no scale
 * - Padding p-8 desktop, p-6 mobile
 */

import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

const surfaceVariants = cva(
  [
    "bg-[var(--paper-100)] border border-[var(--paper-300)]",
    "rounded-md",
    "p-6 md:p-8",
  ].join(" "),
  {
    variants: {
      asLink: {
        true: [
          "block",
          "transition-colors duration-[120ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
          "hover:border-[var(--ink-700)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--clay-500)]",
        ].join(" "),
        false: "",
      },
    },
    defaultVariants: {
      asLink: false,
    },
  },
);

type SurfaceVariants = VariantProps<typeof surfaceVariants>;

type SurfaceAsDiv = ComponentPropsWithoutRef<"div"> & {
  asLink?: false;
  href?: never;
};

type SurfaceAsAnchor = ComponentPropsWithoutRef<"a"> & {
  asLink: true;
  href: string;
};

type SurfaceProps = (SurfaceAsDiv | SurfaceAsAnchor) & SurfaceVariants;

const Surface = forwardRef<HTMLDivElement | HTMLAnchorElement, SurfaceProps>(
  ({ className, asLink, ...props }, ref) => {
    if (asLink) {
      const { href, ...rest } = props as SurfaceAsAnchor;
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={cn(surfaceVariants({ asLink: true, className }))}
          {...rest}
        />
      );
    }

    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        className={cn(surfaceVariants({ asLink: false, className }))}
        {...(props as SurfaceAsDiv)}
      />
    );
  },
);
Surface.displayName = "Surface";

export { Surface, surfaceVariants };
export type { SurfaceProps };
