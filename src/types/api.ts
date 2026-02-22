export interface CustomStyle {
  accentColor: string;      // hex "#06B6D4"
  fontPairing: string;      // preset name key e.g. "midnight-scholar"
  mode: "light" | "dark";
}

export type DetailLevel = "short" | "balanced" | "detailed";

export interface ExplainRequest {
  question: string;
  customStyle?: CustomStyle;
  detailLevel?: DetailLevel;
}

export interface ExplainResponse {
  html: string;
  preset: string;
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
