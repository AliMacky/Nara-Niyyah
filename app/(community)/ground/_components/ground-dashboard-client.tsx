"use client";

/**
 * Ground Dashboard client component.
 * Receives real data from the server component parent (page.tsx).
 * All n8n calls happen server-side — this file is pure rendering + interaction.
 */

import { Flame, Award, Radio, Shield, Zap, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Surface, UppercaseLabel, NaraButton } from "@/components/nara";
import type { VolStats, LeaderboardEntry } from "@/lib/ground-client";

// ---------------------------------------------------------------------------
// Rank thresholds (must match vol-checkin SQL CASE)
// ---------------------------------------------------------------------------

const RANK_THRESHOLDS = [
  { rank: "Constitution Keeper", min: 700 },
  { rank: "District Builder", min: 350 },
  { rank: "Neighborhood Captain", min: 150 },
  { rank: "Steady Hand", min: 50 },
  { rank: "Member", min: 0 },
] as const;

function nextRankInfo(points: number): { nextRank: string; pointsToNext: number } {
  const idx = RANK_THRESHOLDS.findIndex((r) => points >= r.min);
  if (idx <= 0) return { nextRank: "Top rank reached", pointsToNext: 0 };
  const next = RANK_THRESHOLDS[idx - 1];
  return { nextRank: next.rank, pointsToNext: next.min - points };
}

// ---------------------------------------------------------------------------
// Lane definitions
// ---------------------------------------------------------------------------

const LANES = [
  {
    id: "signal",
    name: "Signal",
    tagline: "Amplify online",
    description:
      "Share campaign content, engage on social media, and help Melissa's message reach new audiences across CD9.",
    icon: Radio,
    pointsPerShift: 25,
    href: "/ground/signal",
  },
  {
    id: "shield",
    name: "Shield",
    tagline: "Show up on the ground",
    description:
      "Canvass precincts, phone bank registered voters, and protect access to the ballot box in your neighborhood.",
    icon: Shield,
    pointsPerShift: 35,
    href: "/ground/shield",
  },
  {
    id: "spark",
    name: "Spark",
    tagline: "Grow the movement",
    description:
      "Recruit new volunteers, host coffee chats, and build lasting relationships that turn neighbors into organizers.",
    icon: Zap,
    pointsPerShift: 40,
    href: "/ground/spark",
  },
] as const;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <Surface className="p-5 md:p-5">
      <UppercaseLabel className="block mb-2">{label}</UppercaseLabel>
      <div className="font-serif text-[2rem] leading-[2.25rem] font-medium text-[var(--ink-900)]">
        {value}
      </div>
      {sub && (
        <p className="text-[0.8125rem] text-[var(--ink-500)] mt-1">{sub}</p>
      )}
    </Surface>
  );
}

function RankProgress({
  rank,
  points,
}: {
  rank: string;
  points: number;
}) {
  const { nextRank, pointsToNext } = nextRankInfo(points);
  const isTopRank = pointsToNext === 0;
  const total = isTopRank ? points : points + pointsToNext;
  const pct = isTopRank ? 100 : Math.round((points / total) * 100);

  return (
    <Surface className="p-5 md:p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[1rem] font-medium text-[var(--ink-900)] mb-0.5">
            {rank}
          </p>
          {isTopRank ? (
            <p className="text-[0.8125rem] text-[var(--ink-500)]">
              Highest rank achieved
            </p>
          ) : (
            <p className="text-[0.8125rem] text-[var(--ink-500)]">
              {pointsToNext} pts to{" "}
              <span className="font-medium text-[var(--ink-700)]">{nextRank}</span>
            </p>
          )}
        </div>
        <Award
          size={20}
          strokeWidth={1.5}
          className="text-[var(--clay-500)] shrink-0"
          aria-hidden
        />
      </div>
      <div
        className="h-1.5 rounded-full bg-[var(--paper-300)] overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={isTopRank ? "Top rank reached" : `${pct}% to ${nextRank}`}
      >
        <div
          className="h-full rounded-full bg-[var(--clay-600)] transition-[width] duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[0.75rem] text-[var(--ink-300)] mt-2">
        {points} / {total} points
      </p>
    </Surface>
  );
}

function LaneCard({
  lane,
  isActive,
}: {
  lane: (typeof LANES)[number];
  isActive: boolean;
}) {
  const Icon = lane.icon;
  return (
    <Surface className="p-5 md:p-5">
      <div className="flex items-start gap-4">
        <div className="mt-0.5 p-2 rounded-md bg-[var(--paper-200)] shrink-0">
          <Icon
            size={18}
            strokeWidth={1.75}
            className={
              isActive ? "text-[var(--clay-600)]" : "text-[var(--ink-500)]"
            }
            aria-hidden
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <h3 className="text-[1rem] font-medium text-[var(--ink-900)]">
              {lane.name}
            </h3>
            <span className="text-[0.75rem] text-[var(--ink-300)]">
              {lane.tagline}
            </span>
          </div>
          <p className="text-[0.875rem] leading-[1.375rem] text-[var(--ink-500)] mb-4">
            {lane.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-[0.8125rem] text-[var(--ink-500)]">
              <span className="font-medium text-[var(--ink-900)]">
                +{lane.pointsPerShift} pts
              </span>{" "}
              per shift
            </span>
            <NaraButton
              variant={isActive ? "primary" : "secondary"}
              className="text-[0.8125rem] py-1.5 px-4 flex items-center gap-1.5"
              onClick={() => {
                window.location.href = lane.href;
              }}
            >
              Start shift
              <ChevronRight size={14} strokeWidth={1.75} aria-hidden />
            </NaraButton>
          </div>
        </div>
      </div>
    </Surface>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface GroundDashboardProps {
  volunteer: VolStats;
  leaderboard: LeaderboardEntry[];
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export default function GroundDashboardClient({
  volunteer,
  leaderboard,
}: GroundDashboardProps) {
  const primaryLane = volunteer.lane ?? "Shield";

  return (
    <div className="max-w-4xl mx-auto px-8 lg:px-12 py-12 md:py-16">
      <div className="mb-10">
        <h1 className="font-serif text-[2.25rem] leading-[2.75rem] font-medium text-[var(--ink-900)] mb-1">
          Good to see you, {volunteer.first_name}.
        </h1>
        <p className="text-[1rem] leading-[1.625rem] text-[var(--ink-500)]">
          {primaryLane} Lane
          {volunteer.streak > 0 && (
            <>
              {" "}·{" "}
              <span className="inline-flex items-center gap-1 text-[var(--clay-500)]">
                <Flame size={15} strokeWidth={1.75} aria-label={`${volunteer.streak}-day streak`} />
                {volunteer.streak}-day streak
              </span>
            </>
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatTile label="Your Points" value={volunteer.points} sub="Total earned" />
        <StatTile
          label="Day Streak"
          value={
            <span className="flex items-center gap-1.5">
              {volunteer.streak}
              <Flame size={22} strokeWidth={1.5} className="text-[var(--clay-500)]" aria-hidden />
            </span>
          }
        />
        <StatTile label="Shifts · Month" value={volunteer.shifts_this_month} sub={`${primaryLane} lane`} />
        <StatTile label="Voters Reached" value={volunteer.voters_reached} sub="All shifts combined" />
      </div>

      <div className="mb-10">
        <RankProgress rank={volunteer.rank} points={volunteer.points} />
      </div>

      <div className="mb-12">
        <div className="w-16 h-px bg-[var(--paper-300)] mb-3" />
        <UppercaseLabel className="block mb-5">Activity Lanes</UppercaseLabel>
        <div className="flex flex-col gap-4">
          {LANES.map((lane) => (
            <LaneCard key={lane.id} lane={lane} isActive={lane.name === primaryLane} />
          ))}
        </div>
      </div>

      <div>
        <div className="w-16 h-px bg-[var(--paper-300)] mb-3" />
        <UppercaseLabel className="block mb-5">Top Volunteers</UppercaseLabel>
        <div>
          {leaderboard.map((v, i) => {
            const isYou = v.id === volunteer.id;
            return (
              <div
                key={v.id}
                className={cn(
                  "py-4 flex items-center gap-3",
                  i > 0 && "border-t border-[var(--paper-200)]",
                  isYou && "bg-[var(--paper-100)] -mx-3 px-3 rounded-md border-[var(--paper-200)]",
                )}
              >
                <span
                  className={cn(
                    "w-5 text-center text-[0.875rem] font-medium shrink-0",
                    i === 0 ? "text-[var(--clay-600)]" : "text-[var(--ink-300)]",
                  )}
                  aria-label={`Rank ${i + 1}`}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-[0.875rem] text-[var(--ink-900)]", isYou && "font-medium")}>
                    {v.name}
                    {isYou && (
                      <span className="ml-1.5 text-[0.75rem] font-normal text-[var(--ink-300)]">(you)</span>
                    )}
                  </p>
                  <p className="text-[0.75rem] text-[var(--ink-500)]">{v.rank}</p>
                </div>
                {v.streak > 0 && (
                  <span className="flex items-center gap-0.5 text-[0.75rem] text-[var(--ink-300)] shrink-0">
                    <Flame size={12} strokeWidth={1.75} className="text-[var(--clay-500)]" aria-hidden />
                    {v.streak}d
                  </span>
                )}
                <span className="text-[0.9375rem] font-medium text-[var(--ink-900)] shrink-0 w-10 text-right">
                  {v.points}
                </span>
              </div>
            );
          })}
        </div>
        {leaderboard.length > 0 && (
          <div className="pt-6 border-t border-[var(--paper-200)]">
            <a href="/ground/leaderboard" className="text-[0.875rem] font-medium text-[var(--ink-700)] hover:underline">
              View full leaderboard
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
