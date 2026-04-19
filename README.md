# Nara Frontend

This is the main application for Nara.

If you are looking for the public project overview, start at the repo root:

- [`../README.md`](../README.md)

This file is the technical companion for running and understanding the app.

## App structure

The product is split into two route groups:

- **`(app)`**: organization-facing analytics
- **`(community)`**: policy proposals and Ground

High-level routes:

- `/dashboard`
- `/campaigns`
- `/reports`
- `/policy`
- `/ground`
- `/login`

## Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS v4
- Supabase Auth
- Drizzle ORM + Postgres
- Amazon Bedrock
- n8n webhooks for Ground

## Setup

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Environment variables

Create a `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
DATABASE_URL=

AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
BEDROCK_HAIKU_MODEL_ID=
BEDROCK_SONNET_MODEL_ID=

REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_USER_AGENT=

BLUESKY_HANDLE=
BLUESKY_APP_PASSWORD=

GROUND_N8N_BASE_URL=
```

## Useful commands

```bash
pnpm dev
pnpm typecheck
pnpm lint
```

## Important directories

```txt
app/
  (app)/
  (community)/
  (auth)/
  api/

components/
  nara/
  ui/

lib/
  db/
  design/
  supabase/

server/
  campaigns/
  ground/
  policy/
  scrapers/
  search/
  sentiment/
```

## Notes

- The shared design system lives in `components/nara/`
- Sentiment search is the most mature part of the app
- Ground supports demo-friendly behavior for presentations
- Campaigns are implemented as grouped searches over time
