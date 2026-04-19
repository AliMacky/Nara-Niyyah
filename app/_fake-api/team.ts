import { z } from "zod";
import { createRng, delay } from "./seed";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

export const MemberRoleSchema = z.enum(["owner", "admin", "analyst", "viewer"]);

export const MemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: MemberRoleSchema,
  avatarUrl: z.string().url().nullable(),
  joinedAt: z.string().datetime(),
  lastActiveAt: z.string().datetime(),
});

export const OrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  plan: z.enum(["free", "pro", "enterprise"]),
  memberCount: z.number().int(),
  campaignLimit: z.number().int(),
  createdAt: z.string().datetime(),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MemberRole = z.infer<typeof MemberRoleSchema>;
export type Member = z.infer<typeof MemberSchema>;
export type Organization = z.infer<typeof OrganizationSchema>;

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const ORG: Organization = {
  id: "org-001",
  name: "Cascadia Policy Institute",
  slug: "cascadia-policy",
  plan: "pro",
  memberCount: 5,
  campaignLimit: 20,
  createdAt: "2026-01-15T09:00:00.000Z",
};

const MEMBERS: Member[] = [
  {
    id: "member-001",
    name: "Jordan Kessler",
    email: "jordan@cascadiapolicy.org",
    role: "owner",
    avatarUrl: null,
    joinedAt: "2026-01-15T09:00:00.000Z",
    lastActiveAt: "2026-04-17T14:30:00.000Z",
  },
  {
    id: "member-002",
    name: "Priya Anand",
    email: "priya@cascadiapolicy.org",
    role: "admin",
    avatarUrl: null,
    joinedAt: "2026-01-20T11:00:00.000Z",
    lastActiveAt: "2026-04-18T09:15:00.000Z",
  },
  {
    id: "member-003",
    name: "Marcus Chen",
    email: "marcus@cascadiapolicy.org",
    role: "analyst",
    avatarUrl: null,
    joinedAt: "2026-02-05T08:30:00.000Z",
    lastActiveAt: "2026-04-16T17:45:00.000Z",
  },
  {
    id: "member-004",
    name: "Sofia Reyes",
    email: "sofia@cascadiapolicy.org",
    role: "analyst",
    avatarUrl: null,
    joinedAt: "2026-02-12T10:00:00.000Z",
    lastActiveAt: "2026-04-17T11:20:00.000Z",
  },
  {
    id: "member-005",
    name: "Aiden O'Brien",
    email: "aiden@cascadiapolicy.org",
    role: "viewer",
    avatarUrl: null,
    joinedAt: "2026-03-01T14:00:00.000Z",
    lastActiveAt: "2026-04-10T08:00:00.000Z",
  },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getOrganization(): Promise<Organization> {
  const rng = createRng(5001);
  await delay(rng);
  return ORG;
}

export async function getMembers(): Promise<Member[]> {
  const rng = createRng(5002);
  await delay(rng);
  return MEMBERS;
}
