import type { StylePreset } from "@/types/api";
import type { VocabularyDef } from "@/lib/vocabularies";

/**
 * Encode a font family name for use in a Google Fonts URL.
 * Mirrors the existing pattern in `prompts.ts`.
 */
function fontUrl(fontName: string): string {
  return fontName.replace(/ /g, "+");
}

/**
 * Build the opening portion of the canvas HTML shell.
 *
 * Returns `<!DOCTYPE html>` through the opening `<main class="ae-canvas">`,
 * including Google Fonts links and a shared `<style>` block of utility
 * classes (`ae-section`, `ae-grid`, `ae-card`, `ae-callout`, `ae-stat`,
 * `ae-badge`, `ae-hero`, `ae-takeaways`, …) that the per-section coders
 * will compose into the final canvas.
 *
 * The `vocab` parameter is currently unused but is part of the signature
 * as a forward-compat hook: future vocab-specific shell overrides (e.g.
 * different body padding for `cinematic` vs `museum`) will live here.
 */
export function buildShellOpen(
  preset: StylePreset,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _vocab: VocabularyDef,
): string {
  const headingUrl = fontUrl(preset.fonts.heading);
  const bodyUrl = fontUrl(preset.fonts.body);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=${headingUrl}:wght@300;400;500;600;700&family=${bodyUrl}:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: ${preset.colors.bg};
      --text: ${preset.colors.text};
      --accent: ${preset.colors.accent};
      --surface: ${preset.colors.surface};
      --font-heading: "${preset.fonts.heading}", system-ui, sans-serif;
      --font-body: "${preset.fonts.body}", system-ui, sans-serif;
    }
    * { box-sizing: border-box; }
    html, body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-body);
      margin: 0;
      padding: 0;
      line-height: 1.65;
    }
    h1, h2, h3, h4, h5, h6 { font-family: var(--font-heading); margin: 0 0 1rem; line-height: 1.2; }
    a { color: var(--accent); }
    .ae-canvas { max-width: 1200px; margin: 0 auto; padding: 2rem 1.5rem 6rem; }
    .ae-section { margin: 4rem 0; }
    .ae-section:first-child { margin-top: 1rem; }
    .ae-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
    .ae-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
    @media (max-width: 720px) { .ae-grid-2 { grid-template-columns: 1fr; } }
    .ae-card {
      background: var(--surface);
      border-radius: 16px;
      padding: 1.5rem;
      border: 1px solid color-mix(in oklab, var(--accent) 15%, transparent);
    }
    .ae-callout {
      border-left: 4px solid var(--accent);
      padding: 1rem 1.5rem;
      background: var(--surface);
      border-radius: 0 12px 12px 0;
      margin: 1.5rem 0;
    }
    .ae-stat {
      font-size: 3rem;
      font-weight: 700;
      color: var(--accent);
      line-height: 1;
      font-family: var(--font-heading);
    }
    .ae-stat-label {
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      opacity: 0.7;
    }
    .ae-badge {
      display: inline-block;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      background: color-mix(in oklab, var(--accent) 20%, transparent);
      color: var(--accent);
    }
    .ae-hero {
      padding: 4rem 0 2rem;
      text-align: left;
    }
    .ae-hero h1 {
      font-size: clamp(2.5rem, 6vw, 5rem);
      letter-spacing: -0.02em;
      margin-bottom: 1rem;
    }
    .ae-hero .ae-dek {
      font-size: 1.25rem;
      opacity: 0.85;
      max-width: 60ch;
    }
    .ae-takeaways {
      border-top: 1px solid color-mix(in oklab, var(--accent) 20%, transparent);
      padding-top: 2rem;
      margin-top: 4rem;
    }
    img { max-width: 100%; height: auto; }
    svg { max-width: 100%; }
    @media (prefers-reduced-motion: reduce) {
      * { animation: none !important; transition: none !important; }
    }
  </style>
</head>
<body>
<main class="ae-canvas">
`;
}

/**
 * Build the closing portion of the canvas HTML shell.
 * Pairs with `buildShellOpen` to wrap the parallel-generated sections.
 */
export function buildShellClose(): string {
  return `</main>
</body>
</html>
`;
}
