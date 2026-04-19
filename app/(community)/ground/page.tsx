import { cookies } from "next/headers";
import { getVolStats, getLeaderboard } from "@/lib/ground-client";
import type { VolStats, LeaderboardEntry } from "@/lib/ground-client";
import GroundDashboardClient from "./_components/ground-dashboard-client";
import { GroundChatbot } from "./_components/ground-chatbot";

const DEMO_VOLUNTEER: VolStats = {
  id: 0,
  first_name: "Maria",
  last_name: "R.",
  email: "demo@melissa2026.com",
  points: 487,
  rank: "District Builder",
  streak: 7,
  lane: "Shield",
  secondary_lane: "Signal",
  languages: ["English", "Spanish"],
  shifts_this_month: 8,
  voters_reached: 156,
};

const DEMO_LEADERBOARD: LeaderboardEntry[] = [
  { id: 1, name: "James O.", points: 842, rank: "Constitution Keeper", streak: 12, lane: "Shield" },
  { id: 0, name: "Maria R.", points: 487, rank: "District Builder", streak: 7, lane: "Shield" },
  { id: 2, name: "Priya N.", points: 421, rank: "District Builder", streak: 5, lane: "Signal" },
  { id: 3, name: "David C.", points: 298, rank: "Neighborhood Captain", streak: 3, lane: "Shield" },
  { id: 4, name: "Amara W.", points: 241, rank: "Neighborhood Captain", streak: 4, lane: "Spark" },
  { id: 5, name: "Rosa M.", points: 187, rank: "Neighborhood Captain", streak: 2, lane: "Shield" },
  { id: 6, name: "Kevin T.", points: 143, rank: "Steady Hand", streak: 1, lane: "Signal" },
  { id: 7, name: "Sophie A.", points: 89, rank: "Steady Hand", streak: 0, lane: "Spark" },
];

const FALLBACK_VOLUNTEER: VolStats = {
  id: 1,
  first_name: "Volunteer",
  last_name: "",
  email: "",
  points: 0,
  rank: "Member",
  streak: 0,
  lane: "Shield",
  secondary_lane: null,
  languages: [],
  shifts_this_month: 0,
  voters_reached: 0,
};

export default async function GroundDashboardPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("ground-session");

  const isDemo = !session?.value || session.value === "demo";

  if (isDemo) {
    return (
      <>
        <GroundDashboardClient
          volunteer={DEMO_VOLUNTEER}
          leaderboard={DEMO_LEADERBOARD}
        />
        <GroundChatbot />
      </>
    );
  }

  const volunteerId = Number(session.value);
  const validId = Number.isFinite(volunteerId) && volunteerId > 0;

  const [volResult, lbResult] = await Promise.allSettled([
    validId ? getVolStats(volunteerId) : Promise.reject("no id"),
    getLeaderboard(),
  ]);

  const volunteer =
    volResult.status === "fulfilled" ? volResult.value : FALLBACK_VOLUNTEER;

  const leaderboard =
    lbResult.status === "fulfilled" ? lbResult.value : [];

  return (
    <>
      <GroundDashboardClient volunteer={volunteer} leaderboard={leaderboard} />
      <GroundChatbot />
    </>
  );
}
