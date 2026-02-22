import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { getRandomPreset } from "@/lib/styles";
import { buildCustomPreset } from "@/lib/style-utils";
import { buildThinkerPrompt, buildCoderPrompt, buildShortCoderPrompt } from "@/lib/prompts";
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
  customStyle: z.object({
    accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    fontPairing: z.string(),
    mode: z.enum(["light", "dark"]),
  }).optional(),
  detailLevel: z.enum(["short", "balanced", "detailed"]).optional().default("balanced"),
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

    const { question, detailLevel } = result.data;

    const preset = result.data.customStyle
      ? buildCustomPreset(result.data.customStyle)
      : getRandomPreset();

    console.log("[explain] Detail level:", detailLevel);

    // Detail level configuration
    const config = {
      short:    { thinkerMaxTokens: 0,    thinkerTimeout: 0,     thinkerReasoning: "none"   as const, coderMaxTokens: 12000, coderTimeout: 30_000, coderReasoning: "none"   as const, skipThinker: true,  skipImages: true  },
      balanced: { thinkerMaxTokens: 4000, thinkerTimeout: 30_000, thinkerReasoning: "medium" as const, coderMaxTokens: 24576, coderTimeout: 45_000, coderReasoning: "medium" as const, skipThinker: false, skipImages: false },
      detailed: { thinkerMaxTokens: 6000, thinkerTimeout: 45_000, thinkerReasoning: "high"   as const, coderMaxTokens: 32000, coderTimeout: 60_000, coderReasoning: "high"   as const, skipThinker: false, skipImages: false },
    }[detailLevel];

    let html: string;

    if (config.skipThinker) {
      // SHORT MODE: Skip thinker, send question directly to coder
      const coderPrompt = buildShortCoderPrompt(preset);
      const coderController = new AbortController();
      const coderTimeout = setTimeout(() => coderController.abort(), config.coderTimeout);

      try {
        const rawHtml = await generateExplanation(coderPrompt, question, {
          model: process.env.OPENROUTER_MODEL,
          temperature: 0.2,
          maxTokens: config.coderMaxTokens,
          signal: coderController.signal,
        });
        html = stripCodeFences(rawHtml);
      } finally {
        clearTimeout(coderTimeout);
      }

      console.log("[explain] Short mode — HTML length:", html.length, "| SVGs:", (html.match(/<svg/gi) || []).length);
    } else {
      // BALANCED / DETAILED: Full thinker → coder + images pipeline

      // Stage 1: Thinker — content planning with fast model
      const thinkerPrompt = buildThinkerPrompt(detailLevel);
      const thinkerController = new AbortController();
      const thinkerTimeout = setTimeout(() => thinkerController.abort(), config.thinkerTimeout);

      let contentPlan: string;
      try {
        contentPlan = await generateExplanation(thinkerPrompt, question, {
          model: process.env.OPENROUTER_FAST_MODEL,
          temperature: 0.5,
          maxTokens: config.thinkerMaxTokens,
          signal: thinkerController.signal,
          reasoning: { effort: config.thinkerReasoning },
        });
      } finally {
        clearTimeout(thinkerTimeout);
      }

      console.log("[explain] Thinker done, plan length:", contentPlan.length);

      const imagePrompts = config.skipImages ? [] : parseImagePrompts(contentPlan);
      console.log("[explain] Image prompts found:", imagePrompts.length);

      // Stage 2: Coder + Image Gen in parallel
      const coderPrompt = buildCoderPrompt(preset);
      const coderController = new AbortController();
      const coderTimeout = setTimeout(() => coderController.abort(), config.coderTimeout);

      const coderPromise = generateExplanation(coderPrompt, contentPlan, {
        model: process.env.OPENROUTER_MODEL,
        temperature: 0.2,
        maxTokens: config.coderMaxTokens,
        signal: coderController.signal,
        reasoning: { effort: config.coderReasoning },
      }).finally(() => clearTimeout(coderTimeout));

      // Image generation (parallel, graceful degradation)
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

      html = successfulImages.length > 0
        ? injectImages(cleanHtml, successfulImages)
        : cleanHtml;

      console.log(
        "[explain] HTML length:", html.length,
        "| SVGs:", (html.match(/<svg/gi) || []).length,
        "| Images injected:", successfulImages.length,
      );
    }

    return NextResponse.json({ html, preset: preset.name });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "Request timed out" }, { status: 504 });
    }
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
