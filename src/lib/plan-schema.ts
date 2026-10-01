import { z } from "zod/v4";
import type { JsonSchemaSpec } from "@/lib/openrouter";
import type { PlanSection } from "@/types/api";

/**
 * Structured content-plan schema. The thinker (gemini-3.5-flash) returns JSON
 * matching this via OpenRouter `response_format`; we validate with Zod. This is
 * the SINGLE SOURCE OF TRUTH for sections + images — section `imageIds`
 * reference `images[].id`, so there is no separate image-extraction path that
 * could drift (the old markdown regex parser produced orphan placeholders).
 */

export const ASPECT_RATIOS = ["16:9", "4:3", "1:1", "3:2", "2:3", "9:16"] as const;
export type AspectRatio = (typeof ASPECT_RATIOS)[number];

export const planImageSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  aspectRatio: z.enum(ASPECT_RATIOS).optional().default("16:9"),
});

export const planSectionSchema = z.object({
  title: z.string(),
  keyPoints: z.array(z.string()).optional().default([]),
  visual: z.string().optional().default(""),
  data: z.string().optional().default(""),
  imageIds: z.array(z.string()).optional().default([]),
});

export const planSchema = z.object({
  title: z.string(),
  overview: z.string().optional().default(""),
  sections: z.array(planSectionSchema).optional().default([]),
  takeaways: z.array(z.string()).optional().default([]),
  images: z.array(planImageSchema).optional().default([]),
});

export type Plan = z.infer<typeof planSchema>;
export type PlanImage = z.infer<typeof planImageSchema>;

export function parsePlan(data: unknown): Plan {
  return planSchema.parse(data);
}

/**
 * JSON Schema handed to OpenRouter `response_format`. Authored by hand (fully
 * inlined, no $ref) to stay maximally compatible with provider structured-output
 * enforcement; Zod above is the authoritative validator of the response.
 */
export const PLAN_JSON_SCHEMA: JsonSchemaSpec = {
  name: "content_plan",
  schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "Compelling infographic title" },
      overview: { type: "string", description: "2-3 sentence hero summary" },
      sections: {
        type: "array",
        description: "Ordered body sections",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            keyPoints: {
              type: "array",
              items: { type: "string" },
              description: "Specific, data-rich bullets",
            },
            visual: {
              type: "string",
              description: "Ideal diagram, e.g. 'flowchart A->B->C' or 'bar chart X=70,Y=20'",
            },
            data: { type: "string", description: "Concrete numbers/dates, or empty string" },
            imageIds: {
              type: "array",
              items: { type: "string" },
              description: "Image ids used in this section, e.g. ['img-1']",
            },
          },
          required: ["title", "keyPoints", "visual"],
        },
      },
      takeaways: { type: "array", items: { type: "string" } },
      images: {
        type: "array",
        description:
          "REQUIRED: 1-2 AI-generated image specs for any real-world/science/history/nature/tech/art topic. Empty array ONLY for pure algorithm/math/code questions.",
        items: {
          type: "object",
          properties: {
            id: { type: "string", description: "Sequential id: img-1, img-2" },
            prompt: { type: "string", description: "Vivid image prompt" },
            aspectRatio: { type: "string", enum: [...ASPECT_RATIOS] },
          },
          required: ["id", "prompt"],
        },
      },
    },
    required: ["title", "overview", "sections", "takeaways", "images"],
  },
};

/**
 * Map a validated Plan into the ordered PlanSection[] the section coders consume:
 * hero (from title + overview) → body sections → optional takeaways. Section
 * imageIds are filtered to ids the plan actually declared, dropping any
 * hallucinated references so no orphan placeholders ship.
 */
export function planToSections(plan: Plan): PlanSection[] {
  const declaredIds = new Set(plan.images.map((i) => i.id));
  const sections: PlanSection[] = [];

  sections.push({
    index: 0,
    role: "hero",
    title: plan.title || "Overview",
    keyPoints: [],
    visualDescription: plan.overview,
    data: "",
    imageIds: [],
  });

  for (const s of plan.sections) {
    sections.push({
      index: sections.length,
      role: "body",
      title: s.title,
      keyPoints: s.keyPoints,
      visualDescription: s.visual,
      data: s.data ?? "",
      imageIds: (s.imageIds ?? []).filter((id) => declaredIds.has(id)),
    });
  }

  if (plan.takeaways.length > 0) {
    sections.push({
      index: sections.length,
      role: "takeaways",
      title: "Key Takeaways",
      keyPoints: plan.takeaways,
      visualDescription: "",
      data: "",
      imageIds: [],
    });
  }

  return sections;
}
