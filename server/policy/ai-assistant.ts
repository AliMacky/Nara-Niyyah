"use server";

/**
 * server/policy/ai-assistant.ts
 *
 * AI writing assistance for the policy draft form.
 *
 * The assistant gives structured feedback on a citizen's draft — it does NOT
 * rewrite the content. The goal is to help first-time policy writers understand
 * what's missing or unclear without ghostwriting for them.
 *
 * Per CLAUDE.md: "The AI policy helper must be clearly labeled as assistance,
 * never ghostwriting. A small persistent indicator when AI has edited a draft."
 * This action returns feedback only — the user's text is never modified.
 */

import { invokeClaude } from "@/lib/bedrock/client";

export interface DraftFeedbackInput {
  title: string;
  category: string;
  body: string;
}

export interface DraftFeedbackResult {
  feedback: string;
}

const SYSTEM_PROMPT = `You are a writing assistant for Nara, a civic policy platform where everyday citizens propose policies to their local government. Many users have never written a policy before.

Your job is to give brief, constructive feedback on their draft — NOT to rewrite it. Read what they've written and help them understand how to improve it themselves.

Structure your response in exactly three labeled sections:

What's working
[1-3 sentences on genuine strengths. Be specific, not generic.]

What's missing
[List specific sections or information that would make this policy stronger — e.g. funding mechanism, definitions, enforcement, timeline. If the draft is early-stage, be gentle but honest.]

Suggestions
[2-3 concrete, actionable things the writer can do next. Start each with a verb. Be direct.]

Rules:
- Total response under 250 words
- Plain text only — no markdown, no asterisks, no bullet symbols
- Do not rewrite any part of their draft
- Do not invent facts about their topic
- If the draft is very short or mostly empty, acknowledge that and give format guidance instead of deep feedback`;

export async function getDraftFeedback(
  input: DraftFeedbackInput,
): Promise<DraftFeedbackResult> {
  const hasContent = input.title.trim() || input.body.trim();

  if (!hasContent) {
    return {
      feedback:
        "Add a title and some draft text first, then come back for feedback.",
    };
  }

  const userMessage = [
    input.title ? `Title: ${input.title}` : "",
    input.category ? `Category: ${input.category}` : "",
    input.body
      ? `\nDraft text:\n${input.body}`
      : "\n(No body text written yet — just the title so far.)",
  ]
    .filter(Boolean)
    .join("\n");

  const result = await invokeClaude({
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Please give me feedback on my policy draft:\n\n${userMessage}`,
      },
    ],
    maxTokens: 450,
  });

  return { feedback: result.text };
}
