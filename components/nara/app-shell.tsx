/**
 * AppShell — authenticated dashboard layout.
 *
 * Spec: DESIGN_SYSTEM.md § Navigation — App shell for dashboard
 * - Left rail: 64px collapsed / 220px expanded
 * - Sparse Lucide icons + labels, keyboard-accessible
 * - Collapse toggle at bottom
 * - Active state: clay underline, not background fill
 * - Top strip: context-aware (campaign name, report title, or org name)
 * - Main area: paper-50 background, generous padding
 */

"use client";

import {
  createContext,
  forwardRef,
  useContext,
  useState,
  useCallback,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import {
  LayoutDashboard,
  Megaphone,
  FileBarChart,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Context for rail state
// ---------------------------------------------------------------------------

interface AppShellContextValue {
  collapsed: boolean;
  toggle: () => void;
}

const AppShellContext = createContext<AppShellContextValue>({
  collapsed: false,
  toggle: () => {},
});

export function useAppShell() {
  return useContext(AppShellContext);
}

// ---------------------------------------------------------------------------
// Nav items
// ---------------------------------------------------------------------------

export interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={18} strokeWidth={1.75} /> },
  { label: "Campaigns", href: "/campaigns", icon: <Megaphone size={18} strokeWidth={1.75} /> },
  { label: "Reports", href: "/reports", icon: <FileBarChart size={18} strokeWidth={1.75} /> },
];

// ---------------------------------------------------------------------------
// Rail link
// ---------------------------------------------------------------------------

function RailLink({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <a
      href={item.href}
      className={cn(
        "group flex items-center gap-3 rounded-md px-3 py-2.5",
        "text-[0.875rem] leading-[1.25rem] font-medium",
        "transition-colors duration-[120ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
        "outline-none focus-visible:ring-2 focus-visible:ring-[var(--clay-500)]",
        active
          ? "text-[var(--ink-900)]"
          : "text-[var(--ink-500)] hover:text-[var(--ink-900)]",
        collapsed && "justify-center px-0",
      )}
      aria-current={active ? "page" : undefined}
    >
      <span className="shrink-0">{item.icon}</span>
      {!collapsed && (
        <span
          className={cn(
            "border-b-2 pb-0.5",
            active
              ? "border-[var(--clay-600)]"
              : "border-transparent group-hover:border-[var(--ink-300)]",
          )}
        >
          {item.label}
        </span>
      )}
    </a>
  );
}

// ---------------------------------------------------------------------------
// Left Rail
// ---------------------------------------------------------------------------

function Rail({
  items = DEFAULT_NAV_ITEMS,
  activePath,
}: {
  items?: NavItem[];
  activePath?: string;
}) {
  const { collapsed, toggle } = useAppShell();

  return (
    <nav
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex flex-col",
        "bg-[var(--paper-100)] border-r border-[var(--paper-300)]",
        "transition-[width] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
        collapsed ? "w-16" : "w-[220px]",
      )}
      aria-label="Main navigation"
    >
      {/* Logo area */}
      <div
        className={cn(
          "flex items-center h-14 border-b border-[var(--paper-200)]",
          collapsed ? "justify-center px-0" : "px-5",
        )}
      >
        <span
          className={cn(
            "font-serif font-medium text-[var(--ink-900)]",
            collapsed ? "text-[1.125rem]" : "text-[1.25rem]",
          )}
        >
          {collapsed ? "N" : "Nara"}
        </span>
      </div>

      {/* Nav items */}
      <div className={cn("flex-1 flex flex-col gap-1 py-4", collapsed ? "px-2" : "px-3")}>
        {items.map((item) => (
          <RailLink
            key={item.href}
            item={item}
            active={activePath === item.href}
            collapsed={collapsed}
          />
        ))}
      </div>

      {/* Collapse toggle */}
      <div
        className={cn(
          "border-t border-[var(--paper-200)] py-3",
          collapsed ? "px-2" : "px-3",
        )}
      >
        <button
          onClick={toggle}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2.5 w-full",
            "text-[0.875rem] leading-[1.25rem] font-medium text-[var(--ink-500)]",
            "hover:text-[var(--ink-900)]",
            "transition-colors duration-[120ms]",
            "outline-none focus-visible:ring-2 focus-visible:ring-[var(--clay-500)]",
            collapsed && "justify-center px-0",
          )}
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
        >
          {collapsed ? (
            <PanelLeftOpen size={18} strokeWidth={1.75} />
          ) : (
            <>
              <PanelLeftClose size={18} strokeWidth={1.75} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Top strip
// ---------------------------------------------------------------------------

function TopStrip({
  contextLabel,
}: {
  contextLabel?: string;
}) {
  const { collapsed } = useAppShell();

  return (
    <header
      className={cn(
        "sticky top-0 z-20 h-14 flex items-center border-b border-[var(--paper-200)]",
        "bg-[var(--paper-50)]",
        "transition-[padding-left] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
        collapsed ? "pl-[calc(64px+24px)]" : "pl-[calc(220px+24px)]",
        "pr-6",
      )}
    >
      {contextLabel && (
        <span className="text-[0.75rem] leading-[1rem] font-medium uppercase tracking-wider text-[var(--ink-500)]">
          {contextLabel}
        </span>
      )}
    </header>
  );
}

// ---------------------------------------------------------------------------
// AppShell composite
// ---------------------------------------------------------------------------

interface AppShellProps extends ComponentPropsWithoutRef<"div"> {
  /** Context label for the top strip — org name, campaign name, etc. */
  contextLabel?: string;
  /** Current path for active state. */
  activePath?: string;
  /** Custom nav items (defaults to Dashboard/Campaigns/Reports/Teams). */
  navItems?: NavItem[];
}

const AppShell = forwardRef<HTMLDivElement, AppShellProps>(
  ({ className, contextLabel, activePath, navItems, children, ...props }, ref) => {
    const pathname = usePathname();
    const resolvedActivePath = activePath ?? `/${pathname.split("/")[1]}`;
    const [collapsed, setCollapsed] = useState(false);
    const toggle = useCallback(() => setCollapsed((c) => !c), []);

    return (
      <AppShellContext.Provider value={{ collapsed, toggle }}>
        <div ref={ref} className={cn("min-h-screen", className)} {...props}>
          <Rail items={navItems} activePath={resolvedActivePath} />
          <TopStrip contextLabel={contextLabel} />
          <main
            className={cn(
              "transition-[padding-left] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
              collapsed ? "pl-16" : "pl-[220px]",
              "bg-[var(--paper-50)]",
              "min-h-[calc(100vh-3.5rem)]",
            )}
          >
            {children}
          </main>
        </div>
      </AppShellContext.Provider>
    );
  },
);
AppShell.displayName = "AppShell";

export { AppShell, DEFAULT_NAV_ITEMS };
export type { AppShellProps, NavItem as AppShellNavItem };
