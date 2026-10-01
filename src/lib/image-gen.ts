import { openrouterFetch } from "@/lib/openrouter";

export interface ImageGenResult {
  id: string;
  dataUrl: string;
}

export interface ImageGenOptions {
  /** Aspect ratio passed to the model, e.g. "16:9". Default "16:9". */
  aspectRatio?: string;
  /** Resolution tier: "1K" | "2K" | "4K". Default "1K" (images display ≤600px;
   *  keeps base64 payload within the localStorage history budget). */
  imageSize?: string;
  /** Accent hex for palette conditioning so the image matches the canvas. */
  accent?: string;
  /** Background hex for palette conditioning. */
  bg?: string;
  /** Mood/style descriptor (from preset + vocabulary). */
  mood?: string;
  signal?: AbortSignal;
}

/**
 * Wrap the raw image prompt with palette + style direction so generated images
 * cohere with the canvas (accent/background/mood) instead of clashing.
 */
function conditionPrompt(prompt: string, opts: ImageGenOptions): string {
  const palette =
    opts.accent || opts.bg
      ? `Harmonize with a color palette built around accent ${opts.accent ?? ""} on ${opts.bg ?? "neutral"} backgrounds.`
      : "";
  const mood = opts.mood ? `Overall aesthetic: ${opts.mood}.` : "";
  return [
    prompt,
    "",
    `Editorial-quality illustration, intentional composition, high detail. ${mood} ${palette}`.trim(),
    "No embedded text, captions, watermarks, logos, charts, or UI elements.",
  ].join("\n");
}

/**
 * Generate one image via OpenRouter chat-completions with modalities:["image","text"]
 * (e.g. google/gemini-3.1-flash-image). Returns a base64 data URL.
 */
export async function generateImage(
  prompt: string,
  id: string,
  options: ImageGenOptions = {},
): Promise<ImageGenResult> {
  const model = process.env.OPENROUTER_IMAGE_MODEL;
  if (!model) {
    throw new Error("OPENROUTER_IMAGE_MODEL environment variable is not set");
  }

  const data = await openrouterFetch(
    {
      model,
      modalities: ["image", "text"],
      messages: [{ role: "user", content: conditionPrompt(prompt, options) }],
      image_config: {
        aspect_ratio: options.aspectRatio ?? "16:9",
        image_size: options.imageSize ?? "1K",
      },
    },
    options.signal,
  );

  // OpenRouter returns generated images in choices[0].message.images[]
  const images = (data?.choices?.[0]?.message as { images?: unknown })?.images;
  if (!Array.isArray(images) || images.length === 0) {
    throw new Error("Image generation returned no images");
  }

  const dataUrl = (images[0] as { image_url?: { url?: unknown } })?.image_url?.url;
  if (!dataUrl || typeof dataUrl !== "string") {
    throw new Error("Image generation returned malformed image data");
  }

  return { id, dataUrl };
}
