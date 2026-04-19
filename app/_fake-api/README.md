# _fake-api/

Temporary mock API layer. Provides typed, async functions with realistic data
and artificial latency (150–400ms) so the frontend can be built before the
real backend exists.

## Swapping to the real backend

Replace the function bodies in each module while preserving their signatures
and return types. Feature code imports types and functions from this directory —
those imports stay the same, only the implementation changes.

The zod schemas in each file define the contract. The real backend responses
should validate against these schemas (or the schemas should be moved to a
shared package at that point).

## Modules

- **sentiment.ts** — campaigns, reports, sentiment search, posts
- **policy.ts** — policy feed, drafts, comments, anonymous authors, vote display
- **team.ts** — organization, members
- **auth.ts** — current user stub

## Data stability

All mock data uses a seeded PRNG (`seed.ts`), so results are deterministic
across page reloads. Changing seed constants will change the data.
