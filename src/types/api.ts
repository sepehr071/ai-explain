export interface ExplainRequest {
  question: string;
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
