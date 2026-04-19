import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),

  AWS_REGION: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  BEDROCK_HAIKU_MODEL_ID: z.string().min(1),
  BEDROCK_SONNET_MODEL_ID: z.string().min(1),

  REDDIT_CLIENT_ID: z.string().min(1),
  REDDIT_CLIENT_SECRET: z.string().min(1),
  REDDIT_USER_AGENT: z.string().min(1),

  BLUESKY_HANDLE: z.string().min(1),
  BLUESKY_APP_PASSWORD: z.string().min(1),

  // Ground portal — n8n webhook base URL (server-side only, no NEXT_PUBLIC_)
  GROUND_N8N_BASE_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);
