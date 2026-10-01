import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { getRandomPreset } from "@/lib/styles";
import { buildCustomPreset } from "@/lib/style-utils";
import {
  buildThinkerPrompt,
  buildCoderPrompt,
  buildShortCoderPrompt,
  buildSectionCoderPrompt,
} from "@/lib/prompts";
import { generateExplanation, generateStructured } from "@/lib/openrouter";
import { generateImage, type ImageGenResult } from "@/lib/image-gen";
import { classifyVocabulary } from "@/lib/classifier";
import { getVocabulary, type VocabularyDef } from "@/lib/vocabularies";
import { AE_PRIMITIVES, AE_BRIDGE } from "@/lib/ae-primitives";
import { parsePlan, planToSections, PLAN_JSON_SCHEMA, type Plan } from "@/lib/plan-schema";
import { buildShellOpen, buildShellClose } from "@/lib/shell";
import type { StylePreset, Vocabulary } from "@/types/api";

export const maxDuration = 300;

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^```(?:html|htm)?\s*\n?([\s\S]*?)\n?\s*```$/);
  return match ? match[1].trim() : trimmed;
}

/**
 * Section-coder outputs are supposed to be a single <section>...</section>.
 * Be tolerant: strip code fences; if the response has a full document, extract
 * the first <section>...</section>; otherwise wrap loose content in one.
 */
function stripSectionWrapper(text: string): string {
  const clean = stripCodeFences(text);
  const match = clean.match(/<section\b[\s\S]*?<\/section>/i);
  if (match) return match[0];
  return `<section class="ae-section">${clean}</section>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function injectImages(html: string, images: ImageGenResult[]): string {
  let result = html;
  for (const img of images) {
    const placeholder = new RegExp(
      `<img\\b[^>]*?\\bdata-image-id\\s*=\\s*["']${img.id}["'][^>]*?/?>`,
      "gi"
    );
    result = result.replace(placeholder, (tag) => {
      const stripped = tag.replace(/\s+src\s*=\s*("[^"]*"|'[^']*'|\S+)/gi, "");
      const hasMaxWidth = /\bmax-width\b/i.test(stripped);
      const sizingStyle = hasMaxWidth
        ? ""
        : ` style="max-width:600px; width:100%; height:auto; object-fit:cover; border-radius:16px; display:block; margin:2rem auto;"`;
      return stripped.replace(/^<img\b/i, `<img src="${img.dataUrl}"${sizingStyle}`);
    });
  }
  return result;
}

/**
 * Section coders are told to emit <img data-image-id="..."> for their assigned
 * images but occasionally skip one. For any successfully-generated image with no
 * placeholder in its section, append one so a paid-for image is never wasted.
 */
function ensureImagePlaceholders(sectionHtml: string, assignedIds: string[]): string {
  let out = sectionHtml;
  for (const id of assignedIds) {
    if (new RegExp(`data-image-id\\s*=\\s*["']${id}["']`, "i").test(out)) continue;
    const placeholder = `<img data-image-id="${id}" alt="" loading="lazy" />`;
    out = /<\/section>\s*$/i.test(out)
      ? out.replace(/<\/section>\s*$/i, `${placeholder}</section>`)
      : out + placeholder;
  }
  return out;
}

function injectAEPrimitives(html: string): string {
  const esc = (s: string) => s.replace(/<\/script>/gi, "<\\/script>");
  const tag = `<script>${esc(AE_PRIMITIVES)}</script>\n<script>${esc(AE_BRIDGE)}</script>`;
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${tag}</body>`);
  }
  return html + tag;
}

/**
 * Empty-canvas document (shell + AE + host bridge) used as the iframe srcDoc for
 * progressive streaming. Sections are appended live via postMessage ("ae-section").
 */
function buildProgressiveShell(preset: StylePreset, vocab: VocabularyDef): string {
  const emptyDoc = buildShellOpen(preset, vocab) + "</main>\n</body>\n</html>";
  return injectAEPrimitives(emptyDoc);
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

// Detail-level configuration. Sequential stages (thinker → sections, or
// thinker → monolithic coder) must keep their timeout sums under maxDuration=300.
const CONFIG = {
  short: {
    thinkerMaxTokens: 0, thinkerTimeout: 0, thinkerReasoning: "none" as const,
    coderMaxTokens: 12000, coderTimeout: 60_000, coderReasoning: "none" as const,
    sectionMaxTokens: 0, sectionTimeout: 0, sectionReasoning: "none" as const,
    skipThinker: true, skipImages: true,
  },
  balanced: {
    thinkerMaxTokens: 6000, thinkerTimeout: 60_000, thinkerReasoning: "medium" as const,
    coderMaxTokens: 24576, coderTimeout: 150_000, coderReasoning: "medium" as const,
    sectionMaxTokens: 8000, sectionTimeout: 160_000, sectionReasoning: "minimal" as const,
    skipThinker: false, skipImages: false,
  },
  detailed: {
    thinkerMaxTokens: 9000, thinkerTimeout: 90_000, thinkerReasoning: "high" as const,
    coderMaxTokens: 32000, coderTimeout: 200_000, coderReasoning: "high" as const,
    sectionMaxTokens: 11000, sectionTimeout: 180_000, sectionReasoning: "low" as const,
    skipThinker: false, skipImages: false,
  },
} as const;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const result = requestSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const { question, detailLevel } = result.data;
  const preset = result.data.customStyle
    ? buildCustomPreset(result.data.customStyle)
    : getRandomPreset();
  const config = CONFIG[detailLevel];

  console.log("[explain] Detail level:", detailLevel);

  // NDJSON event stream: status / vocab / plan / shell / section / image / done / error.
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      let closed = false;
      const send = (obj: unknown) => {
        if (closed) return;
        try { controller.enqueue(enc.encode(JSON.stringify(obj) + "\n")); } catch { /* closed */ }
      };
      const close = () => { if (!closed) { closed = true; try { controller.close(); } catch { /* noop */ } } };

      try {
        if (config.skipThinker) {
          // SHORT MODE — single coder call on the raw question; no progressive canvas.
          send({ t: "status", stage: "designing" });
          const vocabName: Vocabulary = "editorial";
          const vocab = getVocabulary(vocabName);
          const ctrl = new AbortController();
          const tmo = setTimeout(() => ctrl.abort(), config.coderTimeout);
          let html: string;
          try {
            const raw = await generateExplanation(buildShortCoderPrompt(preset, vocab), question, {
              model: process.env.OPENROUTER_FAST_MODEL,
              temperature: 0.2,
              maxTokens: config.coderMaxTokens,
              signal: ctrl.signal,
            });
            html = injectAEPrimitives(stripCodeFences(raw));
          } finally { clearTimeout(tmo); }
          console.log("[explain] Short — HTML length:", html.length, "| SVGs:", (html.match(/<svg/gi) || []).length);
          send({ t: "done", html, preset: preset.name, vocab: vocabName });
          return;
        }

        // BALANCED / DETAILED — classifier + structured thinker (parallel).
        send({ t: "status", stage: "thinking" });
        const classifierPromise = classifyVocabulary(question);
        const thinkerCtrl = new AbortController();
        const thinkerTmo = setTimeout(() => thinkerCtrl.abort(), config.thinkerTimeout);
        const thinkerPromise: Promise<Plan | null> = generateStructured(
          buildThinkerPrompt(detailLevel), question, PLAN_JSON_SCHEMA, parsePlan,
          {
            model: process.env.OPENROUTER_FAST_MODEL,
            temperature: 0.5,
            maxTokens: config.thinkerMaxTokens,
            signal: thinkerCtrl.signal,
            reasoning: { effort: config.thinkerReasoning },
          },
        )
          .catch((err) => { console.warn("[explain] thinker failed:", err instanceof Error ? err.message : err); return null; })
          .finally(() => clearTimeout(thinkerTmo));

        const [vocabName, plan] = await Promise.all([classifierPromise, thinkerPromise]);
        const vocab = getVocabulary(vocabName);
        if (plan) plan.images = plan.images.slice(0, 4);
        const sections = plan ? planToSections(plan) : [];
        const bodyCount = sections.filter((s) => s.role === "body").length;
        const images = plan && !config.skipImages ? plan.images : [];
        send({ t: "vocab", vocab: vocabName, preset: preset.name });

        console.log("[explain] Vocab:", vocabName, "| Plan:", plan ? "ok" : "FAILED", "| Body:", bodyCount, "| Images:", images.length);

        // Launch image generation; emit each as it settles (palette-conditioned).
        const imageResults: (ImageGenResult | null)[] = new Array(images.length).fill(null);
        const imageEmitters = images.map((img, idx) => {
          const ctrl = new AbortController();
          const tmo = setTimeout(() => ctrl.abort(), 60_000);
          return generateImage(img.prompt, img.id, {
            aspectRatio: img.aspectRatio,
            accent: preset.colors.accent,
            bg: preset.colors.bg,
            mood: `${preset.mood} · ${vocab.displayName}`,
            signal: ctrl.signal,
          })
            .then((res) => { imageResults[idx] = res; send({ t: "image", id: res.id, url: res.dataUrl }); })
            .catch((err) => { console.warn(`[explain] Image gen failed for ${img.id}:`, err instanceof Error ? err.message : err); })
            .finally(() => clearTimeout(tmo));
        });

        if (bodyCount === 0) {
          // FALLBACK monolithic coder — no progressive canvas; assemble then emit done.
          console.warn("[explain] No body sections, falling back to monolithic coder");
          send({ t: "status", stage: "designing" });
          const ctrl = new AbortController();
          const tmo = setTimeout(() => ctrl.abort(), config.coderTimeout);
          const coderInput = plan ? JSON.stringify(plan) : question;
          let raw: string;
          try {
            raw = await generateExplanation(buildCoderPrompt(preset, vocab), coderInput, {
              model: process.env.OPENROUTER_MODEL,
              temperature: 0.2,
              maxTokens: config.coderMaxTokens,
              signal: ctrl.signal,
              reasoning: { effort: config.coderReasoning },
            });
          } finally { clearTimeout(tmo); }
          await Promise.all(imageEmitters);
          const okImages = imageResults.filter((r): r is ImageGenResult => r !== null);
          let html = stripCodeFences(raw);
          html = okImages.length ? injectImages(html, okImages) : html;
          html = injectAEPrimitives(html);
          send({ t: "done", html, preset: preset.name, vocab: vocabName });
          return;
        }

        // PARALLEL SECTION PATH — stream sections into the shell as they finish.
        const totalSections = sections.length;
        send({ t: "plan", count: totalSections, titles: sections.map((s) => s.title) });
        send({ t: "shell", html: buildProgressiveShell(preset, vocab) });
        send({ t: "status", stage: "designing" });

        const sectionPromises = sections.map((section) => {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), config.sectionTimeout);
          const sysPrompt = buildSectionCoderPrompt(preset, vocab, section, totalSections, section.imageIds);
          const userMsg = JSON.stringify({
            title: section.title,
            keyPoints: section.keyPoints,
            visualDescription: section.visualDescription,
            data: section.data,
            availableImageIds: section.imageIds,
          });
          return generateExplanation(sysPrompt, userMsg, {
            model: process.env.OPENROUTER_MODEL,
            temperature: 0.3,
            maxTokens: config.sectionMaxTokens,
            signal: ctrl.signal,
            reasoning: { effort: config.sectionReasoning },
          })
            .then((r) => stripSectionWrapper(r))
            .catch((err) => {
              console.warn(`[section ${section.index}] failed:`, err instanceof Error ? err.message : err);
              return `<section class="ae-section"><h2>${escapeHtml(section.title)}</h2></section>`;
            })
            .finally(() => clearTimeout(t));
        });

        // Emit sections IN ORDER (generation stays parallel; each prefix flushes ASAP).
        const sectionHtmls: string[] = new Array(totalSections);
        for (let i = 0; i < sectionPromises.length; i++) {
          const h = await sectionPromises[i];
          sectionHtmls[i] = h;
          send({ t: "section", i, html: h });
        }
        await Promise.all(imageEmitters);

        // Assemble the canonical final document for history + export.
        const okImages = imageResults.filter((r): r is ImageGenResult => r !== null);
        const okIds = new Set(okImages.map((im) => im.id));
        const patched = sectionHtmls.map((h, i) =>
          ensureImagePlaceholders(h, sections[i].imageIds.filter((id) => okIds.has(id))),
        );
        let finalHtml = buildShellOpen(preset, vocab) + patched.join("\n") + buildShellClose();
        finalHtml = okImages.length ? injectImages(finalHtml, okImages) : finalHtml;
        finalHtml = injectAEPrimitives(finalHtml);

        console.log("[explain] Final length:", finalHtml.length, "| Sections:", totalSections, "| Images:", okImages.length, "| Vocab:", vocabName);
        send({ t: "done", html: finalHtml, preset: preset.name, vocab: vocabName, sectionCount: totalSections });
      } catch (err) {
        const msg = err instanceof Error && err.name === "AbortError"
          ? "Request timed out"
          : err instanceof Error ? err.message : "An unexpected error occurred";
        console.warn("[explain] stream error:", msg);
        send({ t: "error", error: msg });
      } finally {
        close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
