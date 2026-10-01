/**
 * Shared type definitions for the visual vocabulary system.
 * Each vocabulary describes one cohesive visual language the LLM can choose
 * when rendering a canvas answer.
 */

import type { Vocabulary } from "@/types/api";

export type { Vocabulary };

export interface VocabularyDef {
  name: Vocabulary;
  displayName: string;
  designTokens: string;
  layoutPatterns: string;
  motionVocab: string;
  antiPatterns: string;
  workedExample: string;
  classifierHint: string;
}
