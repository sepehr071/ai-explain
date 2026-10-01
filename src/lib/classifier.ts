import type { Vocabulary } from "@/types/api";
import { generateExplanation } from "@/lib/openrouter";
import { buildClassifierPrompt } from "@/lib/vocabularies";

const VALID: readonly Vocabulary[] = ["editorial", "cinematic", "museum"];

export async function classifyVocabulary(question: string): Promise<Vocabulary> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const raw = await generateExplanation(
      buildClassifierPrompt(),
      question,
      {
        model: process.env.OPENROUTER_FAST_MODEL,
        temperature: 0.0,
        // Gemini 3.x thinks by default and counts it against max_tokens; give
        // headroom + minimal effort so the one-word answer is never starved.
        maxTokens: 1024,
        reasoning: { effort: "minimal" },
        allowTruncated: true,
        signal: controller.signal,
      }
    );

    const normalized = raw.trim().toLowerCase().replace(/["'.,!?]/g, "");
    const firstWord = normalized.split(/\s+/)[0] ?? "";

    if ((VALID as readonly string[]).includes(firstWord)) {
      return firstWord as Vocabulary;
    }

    // Search the full response for any valid vocab name as last-ditch
    for (const v of VALID) {
      if (normalized.includes(v)) return v;
    }

    console.warn("[classifier] Unrecognized response, defaulting editorial:", raw);
    return "editorial";
  } catch (err) {
    console.warn(
      "[classifier] Failed, defaulting editorial:",
      err instanceof Error ? err.message : err
    );
    return "editorial";
  } finally {
    clearTimeout(timeout);
  }
}
