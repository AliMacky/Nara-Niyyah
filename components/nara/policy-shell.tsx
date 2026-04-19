/**
 * PolicyShell — policy platform layout.
 *
 * Spec: DESIGN_SYSTEM.md § Navigation — Policy platform feed
 * - No top strip / chrome above the feed
 * - Feed starts immediately
 * - Quiet left column: region filter + "New policy" CTA
 * - Persistent but minimal
 *
 * Region filter uses URL search params (?region=...) so server components
 * re-render with filtered data when the region changes. The inner nav is
 * wrapped in <Suspense> as required by Next.js for useSearchParams.
 */

"use client";

import { Suspense, forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, MapPin } from "lucide-react";

import { cn } from "@/lib/utils";
import { naraButtonVariants } from "./nara-button";

// ---------------------------------------------------------------------------
// Region list
// ---------------------------------------------------------------------------

export const DEFAULT_REGIONS = [
  "All regions",
  "King County, WA",
  "Multnomah County, OR",
  "Los Angeles County, CA",
  "Maricopa County, AZ",
  "Cook County, IL",
  "Travis County, TX",
  "Denver County, CO",
  "Hennepin County, MN",
];

// Inner component — reads URL to derive active region, pushes to router on change.
// Must be wrapped in <Suspense> because it uses useSearchParams.
function RegionNavInner({ regions }: { regions: string[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeRegion = searchParams.get("region") ?? "All regions";

  function handleRegionChange(region: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (region === "All regions") {
      next.delete("region");
    } else {
      next.set("region", region);
    }
    // Clear cursor when changing region so pagination restarts from the top.
    next.delete("cursor");
    const qs = next.toString();
    router.push(qs ? `/policy?${qs}` : "/policy");
  }

  return (
    <nav aria-label="Region filter" className="flex flex-col gap-1">
      {regions.map((region) => {
        const active = region === activeRegion;
        return (
          <button
            key={region}
            onClick={() => handleRegionChange(region)}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-left",
              "text-[0.875rem] leading-[1.25rem]",
              "transition-colors duration-[120ms]",
              "outline-none focus-visible:ring-2 focus-visible:ring-[var(--clay-500)]",
              active
                ? "font-medium text-[var(--ink-900)]"
                : "text-[var(--ink-500)] hover:text-[var(--ink-900)]",
            )}
            aria-current={active ? "true" : undefined}
          >
            {region !== "All regions" && (
              <MapPin
                size={14}
                strokeWidth={1.75}
                className="shrink-0 text-[var(--ink-300)]"
              />
            )}
            <span
              className={cn(
                "border-b-2 pb-0.5",
                active ? "border-[var(--clay-600)]" : "border-transparent",
              )}
            >
              {region}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

// Static fallback — rendered during SSR / before hydration.
// Shows the full region list with no active state so the layout doesn't shift.
function RegionNavFallback({ regions }: { regions: string[] }) {
  return (
    <nav aria-label="Region filter" className="flex flex-col gap-1">
      {regions.map((region) => (
        <div
          key={region}
          className="flex items-center gap-2 rounded-md px-3 py-2 text-[0.875rem] leading-[1.25rem] text-[var(--ink-500)]"
        >
          {region !== "All regions" && (
            <MapPin
              size={14}
              strokeWidth={1.75}
              className="shrink-0 text-[var(--ink-300)]"
            />
          )}
          <span className="border-b-2 border-transparent pb-0.5">{region}</span>
        </div>
      ))}
    </nav>
  );
}

function RegionNav({ regions = DEFAULT_REGIONS }: { regions?: string[] }) {
  return (
    <Suspense fallback={<RegionNavFallback regions={regions} />}>
      <RegionNavInner regions={regions} />
    </Suspense>
  );
}

// ---------------------------------------------------------------------------
// PolicyShell composite
// ---------------------------------------------------------------------------

interface PolicyShellProps extends ComponentPropsWithoutRef<"div"> {
  /** Custom region list. */
  regions?: string[];
  /** Slot for content above the region list (e.g. platform logotype). */
  header?: ReactNode;
}

const PolicyShell = forwardRef<HTMLDivElement, PolicyShellProps>(
  ({ className, regions, header, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("min-h-screen flex bg-[var(--paper-50)]", className)}
        {...props}
      >
        {/* Left column */}
        <aside
          className={cn(
            "hidden lg:flex lg:flex-col lg:w-[240px] lg:shrink-0",
            "border-r border-[var(--paper-200)]",
            "sticky top-0 h-screen overflow-y-auto",
            "py-8 px-5",
          )}
        >
          {/* Header slot or default */}
          {header ?? (
            <div className="mb-8">
              <span className="font-serif text-[1.25rem] font-medium text-[var(--ink-900)]">
                Nara
              </span>
              <span className="ml-1.5 text-[0.75rem] font-medium uppercase tracking-wider text-[var(--ink-500)]">
                Policy
              </span>
            </div>
          )}

          {/* New policy CTA — navigates to the submission form */}
          <Link
            href="/policy/new"
            className={naraButtonVariants({
              variant: "primary",
              className: "w-full mb-8",
            })}
          >
            <Plus size={16} strokeWidth={1.75} className="mr-1.5" />
            New policy
          </Link>

          {/* Region filter */}
          <div className="mb-6">
            <span className="block text-[0.75rem] leading-[1rem] font-medium uppercase tracking-wider text-[var(--ink-500)] mb-3 px-3">
              Regions
            </span>
            <RegionNav regions={regions} />
          </div>
        </aside>

        {/* Mobile header — visible below lg */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-20 flex items-center justify-between h-14 px-5 bg-[var(--paper-50)] border-b border-[var(--paper-200)]">
          <div className="flex items-center gap-2">
            <span className="font-serif text-[1.125rem] font-medium text-[var(--ink-900)]">
              Nara
            </span>
            <span className="text-[0.75rem] font-medium uppercase tracking-wider text-[var(--ink-500)]">
              Policy
            </span>
          </div>
          <Link
            href="/policy/new"
            className={naraButtonVariants({
              variant: "primary",
              className: "px-3 py-1.5 text-[0.75rem]",
            })}
          >
            <Plus size={14} strokeWidth={1.75} className="mr-1" />
            New
          </Link>
        </div>

        {/* Main feed area */}
        <main
          className={cn(
            "flex-1 min-w-0",
            "pt-16 lg:pt-0",
            "px-5 md:px-8 py-8",
          )}
        >
          {children}
        </main>
      </div>
    );
  },
);
PolicyShell.displayName = "PolicyShell";

export { PolicyShell };
export type { PolicyShellProps };
