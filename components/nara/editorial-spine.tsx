/**
 * EditorialSpine — layout for long-form pages (policy drafts, reports).
 *
 * Usage:
 *   <EditorialSpine>
 *     <p>Main content here...</p>
 *   </EditorialSpine>
 *
 *   <EditorialSpine aside={<MetadataPanel />}>
 *     <p>Content with margin notes on lg+</p>
 *   </EditorialSpine>
 *
 * Spec: DESIGN_SYSTEM.md § Layout principles
 * - max-w-2xl content track, left-aligned spine
 * - Optional margin-note slot on right at lg+
 * - Mobile: single column, aside collapses below content
 */

import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface EditorialSpineProps extends ComponentPropsWithoutRef<"div"> {
  aside?: ReactNode;
}

const EditorialSpine = forwardRef<HTMLDivElement, EditorialSpineProps>(
  ({ className, aside, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "mx-auto w-full max-w-6xl px-6 md:px-8",
          aside ? "lg:grid lg:grid-cols-[minmax(0,42rem)_1fr] lg:gap-16" : "",
          className,
        )}
        {...props}
      >
        <div className="max-w-2xl">{children}</div>
        {aside && (
          <aside className="mt-12 lg:mt-0 lg:sticky lg:top-8 lg:self-start">
            {aside}
          </aside>
        )}
      </div>
    );
  },
);
EditorialSpine.displayName = "EditorialSpine";

export { EditorialSpine };
export type { EditorialSpineProps };
