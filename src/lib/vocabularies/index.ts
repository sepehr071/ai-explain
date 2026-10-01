/**
 * Public entry point for the visual vocabulary system. Aggregates the three
 * vocabulary definitions and exposes lookup + classifier-prompt helpers.
 */

import { editorial } from "./editorial";
import { cinematic } from "./cinematic";
import { museum } from "./museum";
import type { Vocabulary, VocabularyDef } from "./types";

export const vocabularies: Record<Vocabulary, VocabularyDef> = {
  editorial,
  cinematic,
  museum,
};

export const vocabularyNames: Vocabulary[] = ["editorial", "cinematic", "museum"];

export function getVocabulary(name: Vocabulary): VocabularyDef {
  return vocabularies[name];
}

export function buildClassifierPrompt(): string {
  return `You are a vocabulary classifier for AI Explain. Read the user's question and pick exactly ONE visual vocabulary that best fits how to present the answer.

The three vocabularies:

- editorial — ${editorial.classifierHint}
- cinematic — ${cinematic.classifierHint}
- museum — ${museum.classifierHint}

Return ONLY the single lowercase word: editorial, cinematic, or museum.
No quotes. No explanation. No punctuation. No other text. Just one word.`;
}

export type { Vocabulary, VocabularyDef };
