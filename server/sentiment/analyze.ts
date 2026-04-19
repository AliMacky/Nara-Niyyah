import { z } from "zod";
import { invokeClaude } from "@/lib/bedrock/client";
import { env } from "@/env";
import type { ScrapedPost } from "@/server/scrapers/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PostSentiment {
  index: number;
  value: number;
  category: "negative" | "neutral" | "positive";
  confidence: number;
  reasoning: string | null;
}

const sentimentItemSchema = z.object({
  index: z.number().int().nonnegative(),
  value: z.number().min(-1).max(1),
  category: z.enum(["negative", "neutral", "positive"]),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().nullable(),
});

const batchResponseSchema = z.array(sentimentItemSchema);

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

function buildSystemPrompt(searchTerm: string): string {
  return `You are a civic sentiment analyst. You measure how people FEEL about "${searchTerm}" based on social media posts.

CRITICAL: You are measuring sentiment TOWARD "${searchTerm}" — how the author feels about this topic. The question is: "Is this person supportive of, opposed to, or neutral about ${searchTerm}?"

For each post, assign:
- value: -1 (strongly against/hostile) to 1 (strongly supportive/empathetic), 0 = neutral
- category: "negative" (value < -0.15), "neutral" (-0.15 to 0.15), or "positive" (value > 0.15)
- confidence: 0 to 1
- reasoning: one short sentence

Key rules:
- RELEVANCE FIRST: If a post is NOT actually about "${searchTerm}", set confidence to 0 and value to 0. A post mentioning "${searchTerm}" in passing while being about something else is irrelevant.
- Empathy, solidarity, and advocacy FOR the topic = POSITIVE. "Remembering the victims of X" is positive sentiment (showing care/support). "We stand with X" is positive.
- Criticism, hostility, dismissal OF the topic = NEGATIVE. "X is overblown" or "nobody cares about X" is negative.
- Sarcasm: "Oh great, more X" = negative despite surface positivity.
- Reporting facts without opinion = neutral, confidence 0.5-0.7.
- Do NOT confuse the topic being sad/tragic with negative sentiment. A post mourning victims shows POSITIVE sentiment (empathy/support) even though the subject matter is tragic.

Respond with ONLY a JSON array. No markdown fences, no preamble.`;
}

// ---------------------------------------------------------------------------
// Batch analysis
// ---------------------------------------------------------------------------

function buildUserMessage(searchTerm: string, posts: ScrapedPost[]): string {
  const items = posts.map((p, i) => ({
    index: i,
    source: p.source,
    content: p.content.slice(0, 1000),
  }));
  return `The search topic is: "${searchTerm}"

Analyze these ${posts.length} posts for sentiment TOWARD this topic. Return a JSON array with one object per post, keyed by "index" matching the index below.

${JSON.stringify(items, null, 2)}`;
}

function extractJson(text: string): string {
  // Strip markdown fences if present
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();

  // Find first [ and last ]
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start !== -1 && end > start) return text.slice(start, end + 1);

  return text;
}

async function analyzeBatch(
  searchTerm: string,
  posts: ScrapedPost[],
  retry = false,
): Promise<PostSentiment[]> {
  const systemPrompt = retry
    ? buildSystemPrompt(searchTerm) +
      "\n\nIMPORTANT: Your previous response was not valid JSON. Respond with ONLY a valid JSON array. No text before or after the array."
    : buildSystemPrompt(searchTerm);

  const result = await invokeClaude({
    modelId: env.BEDROCK_HAIKU_MODEL_ID,
    system: systemPrompt,
    messages: [{ role: "user", content: buildUserMessage(searchTerm, posts) }],
    maxTokens: 2000,
  });

  console.log(
    `[sentiment] batch of ${posts.length} posts — ${result.usage.inputTokens} in / ${result.usage.outputTokens} out tokens`,
  );

  const jsonStr = extractJson(result.text);
  const parsed = JSON.parse(jsonStr);
  return batchResponseSchema.parse(parsed);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function analyzePosts(
  searchTerm: string,
  posts: ScrapedPost[],
): Promise<PostSentiment[]> {
  const batchSize = 25;
  const results: PostSentiment[] = [];
  let globalOffset = 0;

  for (let i = 0; i < posts.length; i += batchSize) {
    const batch = posts.slice(i, i + batchSize);
    try {
      const sentiments = await analyzeBatch(searchTerm, batch);
      results.push(
        ...sentiments.map((s) => ({ ...s, index: s.index + globalOffset })),
      );
    } catch (firstErr) {
      console.warn(
        `[sentiment] batch ${i}-${i + batch.length} parse failed, retrying with strict prompt`,
        firstErr instanceof Error ? firstErr.message : firstErr,
      );
      try {
        const sentiments = await analyzeBatch(searchTerm, batch, true);
        results.push(
          ...sentiments.map((s) => ({ ...s, index: s.index + globalOffset })),
        );
      } catch (secondErr) {
        console.error(
          `[sentiment] batch ${i}-${i + batch.length} failed twice, skipping`,
          secondErr instanceof Error ? secondErr.message : secondErr,
        );
      }
    }
    globalOffset += batch.length;
  }

  return results;
}
