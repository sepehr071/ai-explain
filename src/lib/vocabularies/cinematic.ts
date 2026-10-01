/**
 * Cinematic Poster vocabulary — full-bleed heroes, layered gradient
 * atmospheres, massive display type, and scroll-driven reveals; evokes an
 * Apple keynote or Stripe marketing page.
 */

import type { VocabularyDef } from "./types";

export const cinematic: VocabularyDef = {
  name: "cinematic",
  displayName: "Cinematic Poster",

  designTokens: `**Typography**
- Sans-serif throughout. No serifs anywhere. Pick from: Inter, Space Grotesk, or Geist.
- Display type is the star. Hero headlines should feel uncomfortable in size — 8rem and up if room allows, 10rem on wide canvases. Weight 800 to 900.
- Tight letter-spacing on display (-0.04em to -0.05em). Tracking opens up only on small labels and uppercase kickers.
- Body copy stays around 1.125rem to 1.25rem, weight 400, generous line-height (1.55-1.65).

**Type ramp**
- Hero display: 8rem to 10rem, weight 800-900, tracking -0.04em, often stacked on multiple lines.
- Section statement type: 3.5rem to 5rem, weight 700.
- Body: 1.125rem to 1.25rem, weight 400.
- Eyebrow / kicker: 0.75rem uppercase, letter-spacing 0.2em, weight 500, often accent-colored.

**Color**
- Dark backgrounds are preferred. Deep blacks, indigos, midnights — let the preset adjust.
- Layered radial gradients create atmosphere: at least two large, soft radial gradients positioned with absolute children behind hero content. Use the preset's accent color as one of the gradient stops.
- High contrast text on dark grounds: near-white body, full-white display.
- Accent appears in: gradient stops, statement-type fragments, scrub SVG strokes, count-up numerals.

**Spacing**
- Generous vertical rhythm. Sections want 8rem+ of vertical padding.
- Full-bleed by default — content escapes container width for hero and statement moments, then optionally returns to a narrower reading column for body.`,

  layoutPatterns: `**Hero (100vh full-bleed)**
- 100vh tall, full viewport width, position: relative, overflow: hidden.
- Two or three absolutely-positioned gradient layers (large radial gradients via div + background-image) sit behind everything. They define the atmosphere.
- Centered (or slightly offset) hero content: a single massive headline, often stacked across multiple lines for poster impact. Below: a one-sentence subtitle. Above: a small uppercase kicker.
- Optional: a subtle scroll cue at the bottom.

**Alternating sections**
- After the hero, alternate between full-bleed dramatic sections (statement typography on atmospheric ground) and centered narrower content (a ~720px reading column for body text or stats).
- Use 8rem+ vertical padding on every section.

**Statement sections**
- A section whose only content is a single large sentence, typeset at 3.5-5rem, centered, with a kicker above. Pure typographic moment.

**Stat moments**
- A full-bleed dark section with a single huge number (10rem+) counting up via \`data-ae="count"\`, with a one-line label beneath.

**Scrub SVG signature**
- A section with a tall SVG (300-600px high) where a particle, line, or path \`data-ae="scrub"\` draws as the user scrolls. This is the cinematic signature.

**Parallax / sticky**
- Optional sticky elements where helpful, but never to the point of confusion. The page should still read top-to-bottom.`,

  motionVocab: `**Motion is central to this vocabulary. Use it confidently.**

- \`data-ae="reveal"\` on heroes, statement sections, stat blocks, and image moments. Most sections get a reveal.
- \`data-ae="scrub"\` is the signature move. Use it on at least one SVG that draws or animates a path as the user scrolls — a particle trajectory, a connecting line, a waveform.
- \`data-ae="count"\` on every prominent number reveal. Huge stat moments depend on this.
- \`data-ae="lightbox"\` on any featured imagery (AI-generated images, hero stills).

**Composition**
- Animations should feel intentional and cinematic, not jittery. One scrub per page is enough — overusing it kills the drama.`,

  antiPatterns: `**Do NOT do any of the following in this vocabulary:**

- NO serif body text. Cinematic is sans-only.
- NO sidebars, drop caps, or pull-quote-style editorial flourishes.
- NO footnotes, citations, or academic apparatus. If the question demands rigor, this is the wrong vocab.
- NO information-dense tables. If you need to communicate dense data, you're in the wrong vocabulary — switch to museum.
- NO emoji.
- NO light backgrounds with neon text. Cinematic favors deep, atmospheric grounds.
- NO marketing-CTA buttons ("Get started"). The mood is awe, not conversion.
- NO display type smaller than 6rem on the hero. If your hero is small, you're not being cinematic.`,

  workedExample: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>QUANTUM</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Inter:wght@400;500;700;800;900&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg: #05060d;
      --ink: #f4f6ff;
      --ink-soft: rgba(244, 246, 255, 0.65);
      --accent: #7c5cff;
      --accent-warm: #ff6ad8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--ink);
      font-family: "Inter", "Space Grotesk", sans-serif;
      font-size: 1.125rem;
      line-height: 1.6;
      overflow-x: hidden;
    }
    .kicker {
      font-size: 0.75rem;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      font-weight: 500;
      color: var(--accent);
    }
    .hero {
      position: relative;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      text-align: center;
      padding: 4rem 1.5rem;
    }
    .glow {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.55;
      pointer-events: none;
      z-index: 0;
    }
    .glow-a {
      width: 720px; height: 720px;
      background: radial-gradient(circle, var(--accent) 0%, transparent 65%);
      top: -120px; left: -160px;
    }
    .glow-b {
      width: 620px; height: 620px;
      background: radial-gradient(circle, var(--accent-warm) 0%, transparent 65%);
      bottom: -180px; right: -140px;
    }
    .hero-content { position: relative; z-index: 1; max-width: 1100px; }
    .hero h1 {
      font-size: clamp(5rem, 14vw, 11rem);
      font-weight: 900;
      letter-spacing: -0.05em;
      line-height: 0.88;
      margin: 1.5rem 0;
    }
    .hero h1 span {
      display: block;
      background: linear-gradient(120deg, var(--ink) 0%, var(--accent) 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    .hero .subtitle {
      font-size: clamp(1rem, 1.4vw, 1.25rem);
      max-width: 48ch;
      margin: 1.5rem auto 0;
      color: var(--ink-soft);
    }
    section.statement {
      padding: 10rem 1.5rem;
      text-align: center;
      position: relative;
    }
    section.statement h2 {
      font-size: clamp(2.5rem, 5vw, 4.5rem);
      font-weight: 700;
      letter-spacing: -0.03em;
      line-height: 1.05;
      max-width: 18ch;
      margin: 1.5rem auto 0;
    }
    section.stat {
      padding: 10rem 1.5rem;
      text-align: center;
      background: linear-gradient(180deg, rgba(124, 92, 255, 0.08), transparent 70%);
    }
    .big-number {
      font-size: clamp(6rem, 16vw, 12rem);
      font-weight: 900;
      letter-spacing: -0.06em;
      line-height: 1;
      background: linear-gradient(180deg, var(--ink), var(--accent));
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    .stat-label {
      margin-top: 1.5rem;
      font-size: 1rem;
      color: var(--ink-soft);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    section.scrub-stage {
      padding: 8rem 1.5rem;
      max-width: 1100px;
      margin: 0 auto;
      text-align: center;
    }
    .scrub-stage svg {
      width: 100%;
      height: 420px;
      margin-top: 3rem;
    }
    .scrub-stage svg path {
      stroke: var(--accent);
      stroke-width: 2;
      fill: none;
    }
  </style>
</head>
<body>
  <section class="hero" data-ae="reveal">
    <div class="glow glow-a"></div>
    <div class="glow glow-b"></div>
    <div class="hero-content">
      <p class="kicker">A New Computational Era</p>
      <h1>
        <span>QUAN</span>
        <span>TUM</span>
      </h1>
      <p class="subtitle">Beyond bits, beyond branches — a machinery built on probability itself, ready to reshape what is computable.</p>
    </div>
  </section>

  <section class="statement" data-ae="reveal">
    <p class="kicker">Premise</p>
    <h2>Where classical computation hesitates, superposition arrives whole.</h2>
  </section>

  <section class="scrub-stage" data-ae="reveal">
    <p class="kicker">Trajectory</p>
    <h2 style="font-size: 2.5rem; font-weight: 700; letter-spacing: -0.02em; margin-top: 1rem;">A particle, drawn through possibility.</h2>
    <svg viewBox="0 0 1000 420" preserveAspectRatio="none">
      <path data-ae="scrub" d="M 20 380 C 200 380, 280 60, 500 220 S 820 380, 980 80" />
    </svg>
  </section>

  <section class="stat" data-ae="reveal">
    <p class="kicker">Scale</p>
    <div class="big-number" data-ae="count" data-from="0" data-to="1024">1024</div>
    <p class="stat-label">qubit coherence states — projected, 2030</p>
  </section>
</body>
</html>`,

  classifierHint: "technology, science fiction, futures, products, abstract concepts, physics, AI, the universe, space, the future, big visions, transformations",
};
