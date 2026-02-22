export interface ImageGenResult {
  id: string;
  dataUrl: string;
}

export async function generateImage(
  prompt: string,
  id: string,
  signal?: AbortSignal
): Promise<ImageGenResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_IMAGE_MODEL;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }
  if (!model) {
    throw new Error("OPENROUTER_IMAGE_MODEL environment variable is not set");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    signal,
    body: JSON.stringify({
      model,
      modalities: ["image"],
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "unknown error");
    throw new Error(`Image generation API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();

  // OpenRouter returns images in message.images array
  const images = data?.choices?.[0]?.message?.images;
  if (!images || !Array.isArray(images) || images.length === 0) {
    throw new Error("Image generation returned no images");
  }

  const dataUrl = images[0]?.image_url?.url;
  if (!dataUrl || typeof dataUrl !== "string") {
    throw new Error("Image generation returned malformed image data");
  }

  return { id, dataUrl };
}
