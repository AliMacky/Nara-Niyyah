import { z } from "zod";
import { invokeClaude } from "@/lib/bedrock/client";
import { env } from "@/env";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Theme {
  name: string;
  postCount: number;
  averageSentiment: number;
}

interface PostWithSentiment {
  index: number;
  content: string;
  sentiment: number;
}

const themeItemSchema = z.object({
  name: z.string(),
  postIndices: z.array(z.number().int().nonnegative()),
});

const themesResponseSchema = z.array(themeItemSchema);

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

function buildSystemPrompt(searchTerm: string): string {
  return `You are a civic discourse analyst. Given a set of social media posts about "${searchTerm}", identify 3–6 recurring discussion themes.

A theme is a specific sub-topic or angle within the broader conversation. Examples for "housing policy": "Rent affordability", "Zoning reform", "Homelessness", "Developer incentives". Each theme name should be 2–4 words, descriptive and specific.

Rules:
- Each post can belong to at most one theme (assign to the best fit).
- Only create a theme if at least 3 posts fit it.
- Order themes by number of posts (most prevalent first).
- If a post doesn't clearly fit any theme, don't include it.
- Return 6 themes maximum.

Respond with ONLY a JSON array: [{ "name": "Theme Name", "postIndices": [0, 3, 7, ...] }]
No markdown fences, no preamble.`;
}

// ---------------------------------------------------------------------------
// Extraction
// ---------------------------------------------------------------------------

function extractJson(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start !== -1 && end > start) return text.slice(start, end + 1);
  return text;
}

export async function extractThemes(
  searchTerm: string,
  postsWithSentiment: PostWithSentiment[],
): Promise<Theme[]> {
  if (postsWithSentiment.length < 3) return [];

  const compressedPosts = postsWithSentiment.map((p) => ({
    index: p.index,
    content: p.content.slice(0, 500),
  }));

  const userMessage = `Topic: "${searchTerm}"

Posts to cluster into themes:
${JSON.stringify(compressedPosts, null, 2)}`;

  let rawThemes: z.infer<typeof themesResponseSchema>;

  try {
    const result = await invokeClaude({
      modelId: env.BEDROCK_HAIKU_MODEL_ID,
      system: buildSystemPrompt(searchTerm),
      messages: [{ role: "user", content: userMessage }],
      maxTokens: 1500,
    });

    console.log(
      `[themes] ${postsWithSentiment.length} posts — ${result.usage.inputTokens} in / ${result.usage.outputTokens} out tokens`,
    );

    const jsonStr = extractJson(result.text);
    rawThemes = themesResponseSchema.parse(JSON.parse(jsonStr));
  } catch (firstErr) {
    console.warn(
      "[themes] first attempt failed, retrying",
      firstErr instanceof Error ? firstErr.message : firstErr,
    );
    try {
      const result = await invokeClaude({
        modelId: env.BEDROCK_HAIKU_MODEL_ID,
        system:
          buildSystemPrompt(searchTerm) +
          "\n\nIMPORTANT: Respond with ONLY valid JSON. No text before or after the array.",
        messages: [{ role: "user", content: userMessage }],
        maxTokens: 1500,
      });
      const jsonStr = extractJson(result.text);
      rawThemes = themesResponseSchema.parse(JSON.parse(jsonStr));
    } catch (secondErr) {
      console.error(
        "[themes] failed twice, returning empty",
        secondErr instanceof Error ? secondErr.message : secondErr,
      );
      return [];
    }
  }

  // Compute average sentiment per theme from existing analysis
  const sentimentMap = new Map<number, number>();
  for (const p of postsWithSentiment) {
    sentimentMap.set(p.index, p.sentiment);
  }

  const themes: Theme[] = rawThemes
    .map((t) => {
      const validIndices = t.postIndices.filter((i) => sentimentMap.has(i));
      if (validIndices.length < 3) return null;

      const avgSentiment =
        validIndices.reduce((sum, i) => sum + sentimentMap.get(i)!, 0) /
        validIndices.length;

      return {
        name: t.name,
        postCount: validIndices.length,
        averageSentiment: Math.round(avgSentiment * 10000) / 10000,
      };
    })
    .filter((t): t is Theme => t !== null)
    .sort((a, b) => b.postCount - a.postCount)
    .slice(0, 6);

  return themes;
}
