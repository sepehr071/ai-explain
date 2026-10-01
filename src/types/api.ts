export interface CustomStyle {
  accentColor: string;      // hex "#06B6D4"
  fontPairing: string;      // preset name key e.g. "midnight-scholar"
  mode: "light" | "dark";
}

export type DetailLevel = "short" | "balanced" | "detailed";

export type Vocabulary = "editorial" | "cinematic" | "museum";

/**
 * One ordered section of a canvas, dispatched to its own parallel coder.
 * Built from the structured content plan (see `lib/plan-schema.ts`).
 */
export interface PlanSection {
  index: number;
  role: "hero" | "body" | "takeaways";
  title: string;
  keyPoints: string[];
  visualDescription: string;
  data: string;
  imageIds: string[];
}

export interface ExplainRequest {
  question: string;
  customStyle?: CustomStyle;
  detailLevel?: DetailLevel;
}

export interface ExplainResponse {
  html: string;
  preset: string;
  vocab: Vocabulary;
  sectionCount?: number;
}

export interface StylePreset {
  name: string;
  colors: {
    bg: string;
    text: string;
    accent: string;
    surface: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  mood: string;
}

export interface PreviewResponse {
  text: string;
}
