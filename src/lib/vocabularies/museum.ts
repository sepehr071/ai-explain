/**
 * Information Museum vocabulary — annotated diagrams, captioned figures,
 * numbered footnotes, and a restrained warm palette in the spirit of Tufte
 * and National Geographic infographics.
 */

import type { VocabularyDef } from "./types";

export const museum: VocabularyDef = {
  name: "museum",
  displayName: "Information Museum",

  designTokens: `**Typography**
- Body: IBM Plex Sans, weight 400, size 1rem. Comfortable, sober, neutral.
- Figure titles, headings, and pull-out terms: IBM Plex Serif, weight 500-600.
- Callouts, labels, captions, and small metadata: IBM Plex Mono, weight 400, slightly tighter line-height.
- Line-height on body: 1.6. Captions: 1.45.

**Type ramp**
- H1 is modest — 2.5rem, serif, weight 600. Not display-sized. The diagrams do the talking.
- H2 ~1.75rem serif, weight 500-600.
- H3 ~1.25rem serif.
- Body ~1rem sans.
- Captions / labels ~0.75rem mono, often slightly muted.
- Footnote markers (¹ ² ³) inline in body; footnotes block ~0.85rem with hairline above.

**Color**
- Warm cream (#f5f1e8) or soft slate is the default ground — the preset may shift it but stay in restrained territory.
- Body text: warm charcoal, never pure black.
- Accent appears in: figure-number kickers ("Fig 1.—"), small highlights inside diagrams, footnote markers. Used sparingly.
- Hairline rules (1px, low-opacity ink) separate figures, footnotes, and section heads.

**Spacing**
- Figures have generous padding inside their frames (2rem+).
- Captions sit tight under their figure (0.5rem gap), in mono, small.
- Section spacing: 3rem between major blocks.
- Comfortable margins — content max-width ~880-960px.`,

  layoutPatterns: `**Section opening**
- Each major section opens with a labeled figure. Format: "Fig 1. — Title of the figure." rendered as a small mono kicker above a serif figure title.
- The figure (SVG diagram or captioned image) follows immediately.
- Caption below the figure is tight, mono, small (~0.75rem), one to three lines.

**Body prose**
- Single-column reading width (~640-720px) for body copy.
- Inline footnote markers as superscripted small numerals (¹ ² ³). Numbering is per-section or per-document.
- Footnotes block sits at the end of each major section, separated by a hairline rule, with mono numbering and serif/sans body in a smaller size.

**"What to notice" sidebar**
- A subtle bordered box (1px hairline, no fill, modest padding) titled "What to notice", containing 2-4 short bullets in mono or sans-small. Used to direct the reader's eye to specific features of an adjacent figure.

**Diagrams**
- SVG diagrams get prominent space. Labels inside diagrams use mono. Connecting lines are hairline (1-1.5px). The diagram is the *content*, not decoration.

**Comparative tables**
- Restrained, hairline-bordered tables for comparisons. Mono headers, sans body. No zebra striping in saturated color — at most a very faint cream tint.

**Section dividers**
- Hairline rule (1px) above a small mono section number ("§ 2") and serif section title.`,

  motionVocab: `**Motion is restrained. The figures are the event, not the animation.**

- \`data-ae="reveal"\` on each figure as it enters the viewport. One figure at a time — never stagger an entire section in one burst. The intent is "the reader notices each figure in turn".
- \`data-ae="lightbox"\` on images (especially AI-generated illustrations) so the reader can zoom in on detail.
- \`data-ae="accordion"\` for "Show derivation", "Show the data", "Show working" — expandable blocks that hide dense technical material until requested.

**AVOID**
- \`data-ae="scrub"\` — scroll-scrubbed drawing is too theatrical for this vocab.
- Aggressive parallax, sticky heroes, or layered atmospheric motion.
- Count-up reveals on every number — only on a single hero stat at the top of the page if at all.`,

  antiPatterns: `**Do NOT do any of the following in this vocabulary:**

- NO atmospheric gradients, glow effects, or "drama" lighting. The page should feel like a printed reference.
- NO display type larger than the H1 (~2.5rem). Hero-poster type belongs in cinematic.
- NO emoji.
- NO neon, saturated, or electric accent colors. Keep accents warm, muted, ink-toned.
- NO marketing-CTA tone. No "Get started today!", no "Discover more!". The voice is precise, descriptive, restrained.
- NO sans-serif on figure titles — figures want serif titles, mono captions.
- NO uncaptioned figures. Every figure has a "Fig N. —" label, a title, and a caption.
- NO drop caps or pull quotes. Those are editorial.`,

  workedExample: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Solar System — Anatomy</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Serif:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <style>
    :root {
      --paper: #f5f1e8;
      --ink: #2a2622;
      --ink-soft: #6b655c;
      --rule: rgba(42, 38, 34, 0.22);
      --accent: #a25a2a;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--paper);
      color: var(--ink);
      font-family: "IBM Plex Sans", sans-serif;
      font-size: 1rem;
      line-height: 1.6;
      padding: 3.5rem 1.5rem 5rem;
    }
    .container { max-width: 920px; margin: 0 auto; }
    h1 {
      font-family: "IBM Plex Serif", serif;
      font-weight: 600;
      font-size: 2.5rem;
      letter-spacing: -0.005em;
      margin-bottom: 0.5rem;
    }
    h2 {
      font-family: "IBM Plex Serif", serif;
      font-weight: 600;
      font-size: 1.75rem;
      margin-bottom: 1rem;
    }
    .meta {
      font-family: "IBM Plex Mono", monospace;
      font-size: 0.75rem;
      letter-spacing: 0.04em;
      color: var(--ink-soft);
      margin-bottom: 2.5rem;
    }
    .section { margin-bottom: 3.5rem; }
    .section + .section { padding-top: 2.5rem; border-top: 1px solid var(--rule); }
    .fig {
      margin: 1.5rem 0 0.5rem;
      padding: 2rem;
      border: 1px solid var(--rule);
      background: rgba(255, 253, 247, 0.55);
    }
    .fig-kicker {
      font-family: "IBM Plex Mono", monospace;
      font-size: 0.75rem;
      letter-spacing: 0.06em;
      color: var(--accent);
      margin-bottom: 0.25rem;
      text-transform: uppercase;
    }
    .fig-title {
      font-family: "IBM Plex Serif", serif;
      font-size: 1.125rem;
      font-weight: 500;
      margin-bottom: 1.25rem;
    }
    .fig svg { display: block; width: 100%; height: auto; }
    .caption {
      font-family: "IBM Plex Mono", monospace;
      font-size: 0.75rem;
      line-height: 1.5;
      color: var(--ink-soft);
      margin-top: 0.75rem;
      max-width: 60ch;
    }
    p { margin-bottom: 1rem; max-width: 64ch; }
    sup.fn {
      font-family: "IBM Plex Mono", monospace;
      font-size: 0.7em;
      color: var(--accent);
      margin-left: 0.05em;
    }
    .footnotes {
      margin-top: 1.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--rule);
      font-size: 0.85rem;
      color: var(--ink-soft);
      max-width: 64ch;
    }
    .footnotes ol { list-style: none; counter-reset: fn; }
    .footnotes li {
      counter-increment: fn;
      padding-left: 1.5rem;
      position: relative;
      margin-bottom: 0.5rem;
      font-family: "IBM Plex Sans", sans-serif;
    }
    .footnotes li::before {
      content: counter(fn);
      position: absolute;
      left: 0; top: 0;
      font-family: "IBM Plex Mono", monospace;
      color: var(--accent);
      font-size: 0.75rem;
    }
    .notice {
      border: 1px solid var(--rule);
      padding: 1.25rem 1.5rem;
      margin: 1.5rem 0;
      max-width: 32rem;
    }
    .notice .label {
      font-family: "IBM Plex Mono", monospace;
      font-size: 0.7rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 0.5rem;
    }
    .notice ul { padding-left: 1rem; font-size: 0.875rem; line-height: 1.55; }
    details.derivation {
      margin: 1.5rem 0;
      border-top: 1px solid var(--rule);
      border-bottom: 1px solid var(--rule);
      padding: 0.75rem 0;
    }
    details.derivation summary {
      cursor: pointer;
      font-family: "IBM Plex Mono", monospace;
      font-size: 0.8rem;
      letter-spacing: 0.05em;
      color: var(--accent);
      text-transform: uppercase;
      list-style: none;
    }
    details.derivation[open] summary { margin-bottom: 0.75rem; }
    details.derivation .body {
      font-family: "IBM Plex Sans", sans-serif;
      font-size: 0.9rem;
      line-height: 1.55;
      color: var(--ink);
    }
    .orbit {
      fill: none;
      stroke: var(--ink-soft);
      stroke-width: 1;
      stroke-dasharray: 2 3;
    }
    .planet { fill: var(--accent); }
    .sun { fill: #d4a02a; }
    .label-text {
      font-family: "IBM Plex Mono", monospace;
      font-size: 9px;
      fill: var(--ink);
    }
  </style>
</head>
<body>
  <main class="container">
    <header>
      <h1>The Solar System — Anatomy</h1>
      <p class="meta">§ Reference · Astronomy · Revised November 2025</p>
    </header>

    <section class="section">
      <h2>Orbits and bodies</h2>
      <p>The Solar System is organized by a single dominant mass, the Sun, around which all other bodies trace approximately elliptical orbits¹. The inner planets are small and rocky; the outer planets are large and gas-rich². The structure is older than 4.5 billion years and remarkably stable.</p>

      <figure class="fig" data-ae="reveal">
        <div class="fig-kicker">Fig 1. —</div>
        <div class="fig-title">Schematic of planetary orbits (not to scale)</div>
        <svg viewBox="0 0 720 220" data-ae="lightbox">
          <ellipse class="orbit" cx="360" cy="110" rx="60" ry="20" />
          <ellipse class="orbit" cx="360" cy="110" rx="110" ry="36" />
          <ellipse class="orbit" cx="360" cy="110" rx="170" ry="56" />
          <ellipse class="orbit" cx="360" cy="110" rx="230" ry="76" />
          <ellipse class="orbit" cx="360" cy="110" rx="300" ry="98" />
          <circle class="sun" cx="360" cy="110" r="10" />
          <circle class="planet" cx="420" cy="110" r="3" />
          <circle class="planet" cx="470" cy="110" r="4" />
          <circle class="planet" cx="530" cy="110" r="4" />
          <circle class="planet" cx="590" cy="110" r="3.5" />
          <circle class="planet" cx="660" cy="110" r="6" />
          <text class="label-text" x="360" y="135" text-anchor="middle">Sun</text>
          <text class="label-text" x="420" y="100" text-anchor="middle">Mercury</text>
          <text class="label-text" x="470" y="100" text-anchor="middle">Venus</text>
          <text class="label-text" x="530" y="100" text-anchor="middle">Earth</text>
          <text class="label-text" x="590" y="100" text-anchor="middle">Mars</text>
          <text class="label-text" x="660" y="100" text-anchor="middle">Jupiter</text>
        </svg>
        <p class="caption">Inner system, schematic. Distances compressed for legibility; the true Mercury-to-Jupiter ratio is approximately 1 to 13.4.</p>
      </figure>

      <aside class="notice">
        <div class="label">What to notice</div>
        <ul>
          <li>Orbits share a common plane (the ecliptic) to within a few degrees.</li>
          <li>Spacing follows an approximately geometric progression (Titius-Bode).</li>
          <li>The asteroid belt occupies the gap between Mars and Jupiter.</li>
        </ul>
      </aside>

      <div class="footnotes">
        <ol>
          <li>Kepler, <em>Astronomia nova</em> (1609). Orbits are ellipses with the Sun at one focus.</li>
          <li>The rocky/gaseous division arises from the position of the protoplanetary frost line.</li>
        </ol>
      </div>
    </section>

    <section class="section">
      <h2>Orbital mechanics</h2>
      <p>An orbit is the steady state of two competing tendencies: gravitational attraction toward the central mass, and the body's tangential momentum. Together they describe a conic section³.</p>

      <figure class="fig" data-ae="reveal">
        <div class="fig-kicker">Fig 2. —</div>
        <div class="fig-title">Forces on an orbiting body</div>
        <svg viewBox="0 0 720 200">
          <circle class="sun" cx="200" cy="100" r="14" />
          <circle class="planet" cx="500" cy="100" r="7" />
          <line x1="500" y1="100" x2="206" y2="100" stroke="var(--accent)" stroke-width="1.5" />
          <line x1="500" y1="100" x2="500" y2="40" stroke="var(--ink)" stroke-width="1.5" />
          <text class="label-text" x="200" y="135" text-anchor="middle">Central mass</text>
          <text class="label-text" x="500" y="135" text-anchor="middle">Body</text>
          <text class="label-text" x="350" y="92" text-anchor="middle">F (gravity)</text>
          <text class="label-text" x="525" y="55">v (tangential)</text>
        </svg>
        <p class="caption">Steady-state equilibrium between centripetal attraction and tangential velocity yields a stable closed orbit.</p>
      </figure>

      <details class="derivation">
        <summary>Show orbital math derivation</summary>
        <div class="body">
          <p>Setting gravitational attraction equal to the centripetal force required for circular motion: GMm/r² = mv²/r. Solving for v gives the orbital velocity v = √(GM/r). Generalizing to ellipses via conservation of angular momentum and energy produces Kepler's three laws.</p>
        </div>
      </details>

      <div class="footnotes">
        <ol>
          <li>Newton, <em>Principia</em>, Book I, Proposition XI. The orbit is a conic section.</li>
        </ol>
      </div>
    </section>
  </main>
</body>
</html>`,

  classifierHint: "mathematics, calculation, scientific procedure, technical specification, comparison, formula, anatomy, mechanism, how it works, classification, taxonomy, derivation",
};
