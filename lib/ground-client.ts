/**
 * Ground portal n8n client.
 *
 * All calls to n8n webhook endpoints for the volunteer-facing Ground portal
 * go through this module — never directly in components or route handlers.
 *
 * Base URL is set via GROUND_N8N_BASE_URL (server-side only).
 * All functions are async and throw on network failure.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

function baseUrl(): string {
  const url = process.env.GROUND_N8N_BASE_URL;
  if (!url) throw new Error("GROUND_N8N_BASE_URL is not set");
  return url.replace(/\/$/, "");
}

async function n8nGet<T>(
  path: string,
  params: Record<string, string | number>,
): Promise<T> {
  const url = new URL(`${baseUrl()}${path}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text().catch(() => "(empty)");
    throw new Error(`n8n GET ${path} → ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

async function n8nPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "(empty)");
    throw new Error(`n8n POST ${path} → ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

export const VolunteerSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  points: z.number(),
  rank: z.string(),
  streak: z.number(),
  lane: z.string().nullable(),
  secondary_lane: z.string().nullable(),
  languages: z.array(z.string()).nullable(),
});

export const VolStatsSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  points: z.number(),
  rank: z.string(),
  streak: z.number(),
  lane: z.string().nullable(),
  secondary_lane: z.string().nullable(),
  languages: z.array(z.string()).nullable(),
  // Computed fields — present if vol-stats query includes JOINs, 0 if not yet
  shifts_this_month: z.number().optional().default(0),
  voters_reached: z.number().optional().default(0),
});

export const LeaderboardEntrySchema = z.object({
  id: z.number(),
  name: z.string(),
  points: z.number(),
  rank: z.string(),
  streak: z.number(),
  lane: z.string().nullable(),
});

export const VoterSchema = z.object({
  voter_id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  residential_address: z.string().nullable(),
  city: z.string().nullable(),
  zip: z.string().nullable(),
  phone: z.string().nullable(),
  propensity_tier: z.string(),
});

export const ContentItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  pillar: z.string().nullable(),
  description: z.string().nullable(),
  keywords: z.string().nullable(),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Volunteer = z.infer<typeof VolunteerSchema>;
export type VolStats = z.infer<typeof VolStatsSchema>;
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;
export type Voter = z.infer<typeof VoterSchema>;
export type ContentItem = z.infer<typeof ContentItemSchema>;

// ---------------------------------------------------------------------------
// Auth endpoints
// ---------------------------------------------------------------------------

/**
 * vol-login — generate and email a magic link.
 * Returns ok:true on success; throws on failure.
 */
export async function requestMagicLink(email: string): Promise<{ ok: boolean }> {
  return n8nPost<{ ok: boolean }>("/webhook/vol-login", { email });
}

/**
 * vol-auth — validate a magic link token.
 * Returns the volunteer profile on success, or throws with a 401-like error
 * if the token is invalid/expired.
 */
export async function validateToken(
  token: string,
): Promise<{ ok: true; volunteer: Volunteer } | { ok: false; error: string }> {
  try {
    const raw = await n8nGet<{ ok: boolean; volunteer?: unknown; error?: string }>(
      "/webhook/vol-auth",
      { token },
    );
    if (!raw.ok) return { ok: false, error: raw.error ?? "Invalid token" };
    const volunteer = VolunteerSchema.parse(raw.volunteer);
    return { ok: true, volunteer };
  } catch (err) {
    if (err instanceof Error && err.message.includes("401")) {
      return { ok: false, error: "Invalid or expired login link." };
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Volunteer data endpoints
// ---------------------------------------------------------------------------

/**
 * vol-stats — fetch current volunteer stats (points, rank, streak, shifts, voters reached).
 */
export async function getVolStats(volunteerId: number): Promise<VolStats> {
  const raw = await n8nGet<unknown>("/webhook/vol-stats", {
    volunteer_id: volunteerId,
  });
  return VolStatsSchema.parse(raw);
}

/**
 * vol-leaderboard — fetch top N volunteers by points.
 */
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const raw = await n8nGet<{ leaderboard?: unknown[] }>("/webhook/vol-leaderboard", {});
  const list = raw.leaderboard ?? (Array.isArray(raw) ? raw : []);
  return z.array(LeaderboardEntrySchema).parse(list);
}

/**
 * vol-assignment — get a batch of voters for this volunteer to contact.
 */
export async function getVoterBatch(volunteerId: number): Promise<Voter[]> {
  const raw = await n8nGet<{ voters?: unknown[] }>("/webhook/vol-assignment", {
    volunteer_id: volunteerId,
  });
  const list = raw.voters ?? (Array.isArray(raw) ? raw : []);
  return z.array(VoterSchema).parse(list);
}

/**
 * vol-content — fetch campaign content/talking points.
 */
export async function getContent(): Promise<ContentItem[]> {
  const raw = await n8nGet<{ content?: unknown[] }>("/webhook/vol-content", {});
  const list = raw.content ?? (Array.isArray(raw) ? raw : []);
  return z.array(ContentItemSchema).parse(list);
}

// ---------------------------------------------------------------------------
// Action endpoints
// ---------------------------------------------------------------------------

/**
 * vol-profile — update volunteer preferences after intake.
 */
export async function updateProfile(
  volunteerId: number,
  data: {
    volunteer_interests?: string[];
    languages?: string[];
    preferred_mode?: string | null;
    leadership_potential?: boolean;
  },
): Promise<{ ok: boolean; lane: string; rank: string; points: number }> {
  return n8nPost("/webhook/vol-profile", {
    volunteer_id: volunteerId,
    ...data,
  });
}

/**
 * vol-checkin — check a volunteer in or out of a shift.
 */
export async function checkInOut(
  volunteerId: number,
  action: "checkin" | "checkout",
  options?: { activity_type?: string; lane?: string; shift_id?: number },
): Promise<
  | { ok: true; action: "checkin"; shift_id: number }
  | {
      ok: true;
      action: "checkout";
      points_awarded: number;
      total_points: number;
      rank: string;
      streak: number;
    }
> {
  return n8nPost("/webhook/vol-checkin", {
    action,
    volunteer_id: volunteerId,
    ...options,
  });
}

/**
 * vol-interaction — log a canvass or outreach interaction.
 */
export async function logInteraction(data: {
  volunteer_id: number;
  voter_id: string;
  activity_type: string;
  outcome: string;
  notes?: string;
}): Promise<{ ok: boolean; interaction_id: number }> {
  return n8nPost("/webhook/vol-interaction", data);
}
