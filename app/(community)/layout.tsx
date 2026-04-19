import { redirect } from "next/navigation";
import { AppShell } from "@/components/nara/app-shell";
import type { AppShellNavItem } from "@/components/nara/app-shell";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ScrollText, Flag } from "lucide-react";

const COMMUNITY_NAV: AppShellNavItem[] = [
  {
    label: "Proposals",
    href: "/policy",
    icon: <ScrollText size={18} strokeWidth={1.75} />,
  },
  {
    label: "Ground",
    href: "/ground",
    icon: <Flag size={18} strokeWidth={1.75} />,
  },
];

export default async function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AppShell
      contextLabel="Nara Community"
      navItems={COMMUNITY_NAV}
    >
      {children}
    </AppShell>
  );
}
