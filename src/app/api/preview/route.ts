import { NextResponse } from "next/server";
import { z } from "zod/v4";

export const maxDuration = 30;

const requestSchema = z.object({
  question: z.string().min(1).max(500),
});

const PREVIEW_PROMPT = "You are a helpful assistant. Answer the question concisely in 2-3 sentences. Be accurate and direct. No markdown formatting, no bullet points, just plain flowing text.";

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

    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_FAST_MODEL;

    if (!apiKey || !model) {
      return NextResponse.json(
        { error: "Preview model not configured" },
        { status: 500 }
      );
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 200,
        messages: [
          { role: "system", content: PREVIEW_PROMPT },
          { role: "user", content: result.data.question },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "unknown");
      throw new Error(`OpenRouter error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;

    if (!text || typeof text !== "string") {
      throw new Error("Empty response from preview model");
    }

    return NextResponse.json({ text });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Preview failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
