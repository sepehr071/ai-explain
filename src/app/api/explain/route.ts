import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { getRandomPreset } from "@/lib/styles";
import { buildThinkerPrompt, buildCoderPrompt } from "@/lib/prompts";
import { generateExplanation } from "@/lib/openrouter";
import { generateImage, type ImageGenResult } from "@/lib/image-gen";

export const maxDuration = 120;

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^```(?:html|htm)?\s*\n?([\s\S]*?)\n?\s*```$/);
  return match ? match[1].trim() : trimmed;
}

interface ImagePrompt {
  id: string;
  prompt: string;
}

function parseImagePrompts(contentPlan: string): ImagePrompt[] {
  const prompts: ImagePrompt[] = [];
  const regex = /\*\*img-(\d+):\*\*\s*(.+)/g;
  let match;

  while ((match = regex.exec(contentPlan)) !== null) {
    const id = `img-${match[1]}`;
    const prompt = match[2].trim();
    if (prompt.toLowerCase().includes("no images needed")) continue;
    prompts.push({ id, prompt });
  }

  return prompts.slice(0, 2);
}

function injectImages(html: string, images: ImageGenResult[]): string {
  let result = html;
  for (const img of images) {
    const placeholder = new RegExp(
      `<img\\s+data-image-id="${img.id}"([^>]*)\\s*/?>`,
      "gi"
    );
    result = result.replace(placeholder, (_, attrs) => {
      let cleanAttrs = (attrs as string).replace(/\s*src="[^"]*"/gi, "");
      // Ensure images have sensible sizing even if coder didn't style them
      if (!cleanAttrs.includes("max-width")) {
        cleanAttrs += ` style="max-width:600px; width:100%; height:auto; object-fit:cover; border-radius:16px; display:block; margin:2rem auto;"`;
      }
      return `<img src="${img.dataUrl}"${cleanAttrs} />`;
    });
  }
  return result;
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

    // Stage 1: Thinker — content planning with fast model
    const thinkerPrompt = buildThinkerPrompt();
    const thinkerController = new AbortController();
    const thinkerTimeout = setTimeout(() => thinkerController.abort(), 20_000);

    let contentPlan: string;
    try {
      contentPlan = await generateExplanation(thinkerPrompt, question, {
        model: process.env.OPENROUTER_FAST_MODEL,
        temperature: 0.5,
        maxTokens: 4000,
        signal: thinkerController.signal,
      });
    } finally {
      clearTimeout(thinkerTimeout);
    }

    console.log("[explain] Thinker done, plan length:", contentPlan.length);

    const imagePrompts = parseImagePrompts(contentPlan);
    console.log("[explain] Image prompts found:", imagePrompts.length);

    // Stage 2: Coder + Image Gen in parallel
    const preset = getRandomPreset();
    const coderPrompt = buildCoderPrompt(preset);

    // 2a: Coder
    const coderController = new AbortController();
    const coderTimeout = setTimeout(() => coderController.abort(), 45_000);

    const coderPromise = generateExplanation(coderPrompt, contentPlan, {
      model: process.env.OPENROUTER_MODEL,
      temperature: 0.2,
      maxTokens: 24576,
      signal: coderController.signal,
    }).finally(() => clearTimeout(coderTimeout));

    // 2b: Image generation (parallel, graceful degradation)
    const imagePromises = imagePrompts.map((ip) => {
      const imgController = new AbortController();
      const imgTimeout = setTimeout(() => imgController.abort(), 30_000);

      return generateImage(ip.prompt, ip.id, imgController.signal)
        .catch((err) => {
          console.warn(`[explain] Image gen failed for ${ip.id}:`, err instanceof Error ? err.message : err);
          return null;
        })
        .finally(() => clearTimeout(imgTimeout));
    });

    // Await all in parallel
    const [rawHtml, ...imageResults] = await Promise.all([
      coderPromise,
      ...imagePromises,
    ]);

    const cleanHtml = stripCodeFences(rawHtml);

    // Stage 3: Merge — inject images into placeholders
    const successfulImages = imageResults.filter(
      (r): r is ImageGenResult => r !== null
    );

    const html = successfulImages.length > 0
      ? injectImages(cleanHtml, successfulImages)
      : cleanHtml;

    console.log(
      "[explain] HTML length:", html.length,
      "| SVGs:", (html.match(/<svg/gi) || []).length,
      "| Images injected:", successfulImages.length,
    );

    return NextResponse.json({ html, preset: preset.name });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "Request timed out" }, { status: 504 });
    }
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
