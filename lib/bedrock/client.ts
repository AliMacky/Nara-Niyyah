import {
  BedrockRuntimeClient,
  ConverseCommand,
  ThrottlingException,
} from "@aws-sdk/client-bedrock-runtime";
import { z } from "zod";
import { env } from "@/env";

// ---------------------------------------------------------------------------
// Singleton client
// ---------------------------------------------------------------------------

const bedrockClient = new BedrockRuntimeClient({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

// ---------------------------------------------------------------------------
// Response schema
// ---------------------------------------------------------------------------

const converseResponseSchema = z.object({
  output: z.object({
    message: z.object({
      content: z.array(z.object({ text: z.string().optional() }).passthrough()),
    }),
  }),
  usage: z.object({
    inputTokens: z.number(),
    outputTokens: z.number(),
    totalTokens: z.number(),
  }),
  stopReason: z.string(),
});

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

export interface InvokeClaudeParams {
  modelId?: string;
  system: string;
  messages: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  maxTokens: number;
}

export interface InvokeClaudeResult {
  text: string;
  usage: { inputTokens: number; outputTokens: number };
}

export async function invokeClaude(
  params: InvokeClaudeParams,
): Promise<InvokeClaudeResult> {
  const modelId = params.modelId ?? env.BEDROCK_HAIKU_MODEL_ID;

  const command = new ConverseCommand({
    modelId,
    system: [{ text: params.system }],
    messages: params.messages.map((m) => ({
      role: m.role,
      content: [{ text: m.content }],
    })),
    inferenceConfig: {
      maxTokens: params.maxTokens,
    },
  });

  let response;
  try {
    response = await bedrockClient.send(command);
  } catch (err) {
    if (err instanceof ThrottlingException) {
      // Single exponential-backoff retry
      const delay = 1000 + Math.random() * 2000;
      await new Promise((r) => setTimeout(r, delay));
      response = await bedrockClient.send(command);
    } else {
      throw err;
    }
  }

  const parsed = converseResponseSchema.parse(response);
  const text =
    parsed.output.message.content
      .map((block) => block.text ?? "")
      .join("")
      .trim() || "";

  return {
    text,
    usage: {
      inputTokens: parsed.usage.inputTokens,
      outputTokens: parsed.usage.outputTokens,
    },
  };
}
