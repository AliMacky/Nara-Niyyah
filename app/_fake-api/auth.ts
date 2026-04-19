import { z } from "zod";
import { createRng, delay } from "./seed";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

export const CurrentUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["owner", "admin", "analyst", "viewer"]),
  organizationId: z.string(),
  organizationName: z.string(),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CurrentUser = z.infer<typeof CurrentUserSchema>;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getCurrentUser(): Promise<CurrentUser> {
  const rng = createRng(6001);
  await delay(rng);
  return {
    id: "member-002",
    name: "Priya Anand",
    email: "priya@cascadiapolicy.org",
    role: "admin",
    organizationId: "org-001",
    organizationName: "Cascadia Policy Institute",
  };
}
