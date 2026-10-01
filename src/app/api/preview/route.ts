import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { generateExplanation } from "@/lib/openrouter";

export const maxDuration = 30;

const requestSchema = z.object({
  question: z.string().min(1).max(500),
});

const PREVIEW_PROMPT =
  "You are a helpful assistant. Answer the question concisely in 2-3 sentences. Be accurate and direct. No markdown formatting, no bullet points, just plain flowing text.";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = requestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);

    try {
      const text = await generateExplanation(PREVIEW_PROMPT, result.data.question, {
        model: process.env.OPENROUTER_FAST_MODEL,
        temperature: 0.3,
        maxTokens: 200,
        signal: controller.signal,
        allowTruncated: true,
      });
      return NextResponse.json({ text });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "Preview timed out" }, { status: 504 });
    }
    const message = error instanceof Error ? error.message : "Preview failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
