import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { writeFile } from "fs/promises";
import { join } from "path";
import { getRandomPreset } from "@/lib/styles";
import { buildSystemPrompt } from "@/lib/prompts";
import { generateExplanation } from "@/lib/openrouter";

export const maxDuration = 60;

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^```(?:html|htm)?\s*\n?([\s\S]*?)\n?\s*```$/);
  return match ? match[1].trim() : trimmed;
}

const requestSchema = z.object({
  question: z.string().min(1, "Question is required").max(500, "Question must be 500 characters or fewer"),
});

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

    const { question } = result.data;
    const preset = getRandomPreset();
    const systemPrompt = buildSystemPrompt(preset);
    const rawHtml = await generateExplanation(systemPrompt, question);
    const html = stripCodeFences(rawHtml);

    // Debug: save raw LLM output for inspection
    const debugPath = join(process.cwd(), "public", "debug-last-response.html");
    await writeFile(debugPath, html, "utf-8").catch(() => {});
    console.log("[explain] HTML length:", html.length, "| SVGs:", (html.match(/<svg/gi) || []).length);

    return NextResponse.json({ html, preset: preset.name });
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
