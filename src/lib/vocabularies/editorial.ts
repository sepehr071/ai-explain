/**
 * Editorial Magazine vocabulary — serif-led, asymmetric grid, drop caps, pull
 * quotes, and generous whitespace, evoking long-form publications like
 * Pitchfork or The Atlantic.
 */

import type { VocabularyDef } from "./types";

export const editorial: VocabularyDef = {
  name: "editorial",
  displayName: "Editorial Magazine",

  designTokens: `**Typography**
- Use a rich body serif for the running text: Lora, Source Serif Pro, or EB Garamond. Pick one and stay with it.
- Pair it with a clean sans-serif for accents, labels, bylines, and small caps: Inter or IBM Plex Sans.
- Generous line-height: 1.65 to 1.75 on body copy. Never tighter than 1.55.
- Body size sits at roughly 1.125rem. Comfortable, never cramped.

**Type ramp**
- Hero headline is huge — 4rem to 6rem, weight 600 to 700, slightly tightened tracking (-0.01em).
- Dek (subtitle under the headline) is prominent: ~1.5rem, light or regular weight, italic optional.
- Section headings are restrained — 1.75rem to 2.25rem, serif, weight 600.
- Pull quotes are large italic serif, ~2rem.
- Byline / kicker / labels are small uppercase sans-serif (~0.75rem, letter-spacing 0.12em).

**Color**
- Restrained palette. Let the preset's accent color be the *only* point of saturation on the page.
- Background: paper-like cream or near-white in light mode; muted ink in dark mode.
- Body text: a true high-contrast ink color (not pure black on cream — slightly warmer).
- Accent appears only in: kicker labels, drop cap, pull-quote rules, link underlines, small flourishes.

**Spacing**
- 4-column underlying grid. Most body content occupies columns 2-3 (the middle two), leaving asymmetric margins.
- Section gaps are generous: 4rem to 6rem between major blocks.
- Whitespace is structural, not decorative — let the page breathe.`,

  layoutPatterns: `**Opening hero**
- Massive headline. Below it: a dek (subtitle, italic optional). Below that: a small uppercase byline / kicker line ("BY THE EDITORS · NOVEMBER 2025 · 12 MIN READ"). Above the headline, an even smaller kicker that names the rubric.
- Hero takes a comfortable amount of vertical space but does NOT need to be 100vh. Editorial is text-led, not poster-led.

**Drop cap**
- The first paragraph of the article body begins with a drop cap: large serif initial, 4-5 lines tall, slightly different color (accent or warm ink), floated left. The rest of the paragraph wraps around it.

**Asymmetric two-column with sidebar callouts**
- Underlying 4-column grid. Body runs in columns 2-3. Occasional "side material" lives in column 4 (or column 1, alternating): small sans-serif callouts with a hairline top rule, ~0.875rem, labeled "Aside" or "On the margin".
- Don't overuse sidebars — one per 2-3 sections.

**Pull quotes**
- Break the flow every ~3 sections with a pull quote: large italic serif text, hairline rule above and below (1px, accent color), centered or left-aligned. The quote spans the body width, not the full page.

**Section dividers**
- Subtle hairlines (1px, low-opacity ink), NOT chunky bars or colored blocks. Sometimes just extra vertical whitespace and a small kicker for the new section.

**End material**
- Optional small "Further reading" or "Footnotes" block at the bottom, sans-serif, small.`,

  motionVocab: `**Use sparingly. This is a text-led vocabulary, not an animation-led one.**

- \`data-ae="reveal"\` on each major *section* container (hero, body sections, pull quote, end material). Never on every paragraph — that's noise.
- \`data-ae="count"\` may appear on standout numeric stats embedded *inside* body prose (e.g. "the population reached **<span data-ae='count' data-from='0' data-to='8100000000'>8.1 billion</span>**"). One or two per article, no more.
- \`data-ae="accordion"\` is appropriate for sidebar "On the margin" boxes when you want a "read more" expandable, or for an end-of-article "Footnotes" block.

**AVOID**
- \`data-ae="scrub"\` — scroll-scrubbed SVG drawing is for cinematic, not editorial.
- Parallax on hero. Editorial doesn't shout — it composes.`,

  antiPatterns: `**Do NOT do any of the following in this vocabulary:**

- NO full-bleed gradients or atmospheric color washes. Editorial uses paper, not posters.
- NO chunky cards, tiles, or dashboard-style boxes with heavy shadows.
- NO emoji anywhere — especially not in headings.
- NO neon, electric, or saturated colors. Restraint is the point.
- NO display type larger than 6rem on body sections (only the hero gets the largest size).
- NO sans-serif body text. The body must be serif. Sans-serif is for labels, bylines, callouts, and kickers only.
- NO marketing CTAs ("Sign up today!"). The voice is curatorial and reflective.
- NO dense data tables or dashboard layouts. If the question wants those, this is the wrong vocab.`,

  workedExample: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Time — A Brief Inquiry</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400;1,600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    :root {
      --ink: #1a1814;
      --ink-soft: #4a463f;
      --paper: #f6f1e7;
      --accent: #b03a2e;
      --rule: rgba(26, 24, 20, 0.18);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--paper);
      color: var(--ink);
      font-family: "Lora", Georgia, serif;
      font-size: 1.125rem;
      line-height: 1.72;
      padding: 4rem 1.5rem 6rem;
    }
    .container { max-width: 980px; margin: 0 auto; }
    .grid {
      display: grid;
      grid-template-columns: 1fr 2.4fr 1fr;
      gap: 2.5rem;
    }
    .kicker {
      font-family: "Inter", sans-serif;
      font-size: 0.75rem;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--accent);
      font-weight: 500;
    }
    .hero { margin-bottom: 5rem; }
    .hero h1 {
      font-size: clamp(3rem, 6vw, 5.5rem);
      line-height: 1.02;
      font-weight: 600;
      letter-spacing: -0.01em;
      margin: 1.25rem 0 1.5rem;
    }
    .hero .dek {
      font-size: 1.5rem;
      font-style: italic;
      color: var(--ink-soft);
      max-width: 38ch;
      line-height: 1.45;
    }
    .byline {
      font-family: "Inter", sans-serif;
      font-size: 0.75rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--ink-soft);
      margin-top: 2.5rem;
    }
    .body-section { margin-bottom: 4.5rem; }
    .body-section h2 {
      font-size: 2rem;
      font-weight: 600;
      margin-bottom: 1.25rem;
      letter-spacing: -0.005em;
    }
    .body-section p { margin-bottom: 1.25rem; }
    .drop-cap::first-letter {
      font-size: 5.5rem;
      font-weight: 600;
      float: left;
      line-height: 0.9;
      padding: 0.5rem 0.75rem 0 0;
      color: var(--accent);
      font-family: "Lora", serif;
    }
    .pull-quote {
      margin: 3.5rem 0;
      padding: 1.75rem 0;
      border-top: 1px solid var(--accent);
      border-bottom: 1px solid var(--accent);
      font-style: italic;
      font-size: 1.875rem;
      line-height: 1.4;
      color: var(--ink);
      text-align: center;
      max-width: 30ch;
      margin-left: auto;
      margin-right: auto;
    }
    .aside {
      border-top: 1px solid var(--rule);
      padding-top: 0.75rem;
      font-family: "Inter", sans-serif;
      font-size: 0.875rem;
      line-height: 1.55;
      color: var(--ink-soft);
    }
    .aside .label {
      font-size: 0.7rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 0.5rem;
      font-weight: 500;
    }
    .divider {
      width: 3rem;
      height: 1px;
      background: var(--rule);
      margin: 3rem auto;
    }
  </style>
</head>
<body>
  <article class="container">
    <header class="hero" data-ae="reveal">
      <div class="kicker">Essay · Volume IV</div>
      <h1>Time — A Brief Inquiry</h1>
      <p class="dek">What we mean when we say a thing is "now," and why the answer keeps slipping away.</p>
      <p class="byline">By The Editors · November 2025 · 12 min read</p>
    </header>

    <section class="body-section grid" data-ae="reveal">
      <div></div>
      <div>
        <p class="drop-cap">Time, Augustine wrote, is something we all understand until someone asks us to explain it. The remark has aged with the question: every generation rediscovers it, often after a long detour through physics or theology, and finds the old confusion waiting politely on the other side.</p>
        <p>This essay is not an argument so much as an attempt to mark where the confusion lives. To ask whether time flows, whether the present is privileged, whether duration is real or a trick of memory — these are not separate questions, but rooms in the same house.</p>
      </div>
      <aside class="aside">
        <div class="label">On the margin</div>
        <p>Augustine's <em>Confessions</em>, Book XI, remains the cleanest statement of the puzzle in the Western tradition.</p>
      </aside>
    </section>

    <blockquote class="pull-quote" data-ae="reveal">
      "The present, if it is anything at all, is a knife edge between two infinities — and yet it is the only place we ever live."
    </blockquote>

    <section class="body-section grid" data-ae="reveal">
      <div></div>
      <div>
        <h2>The Block and the River</h2>
        <p>There are roughly two pictures. In the first, the universe is a block: past, present, and future all equally real, and what we call "the flow of time" is a feature of our experience, not the world. In the second, only the present is real — the future has not yet happened, the past no longer exists.</p>
        <p>Physics, in its current dress, prefers the block. Our experience prefers the river. The disagreement is older than physics.</p>
      </div>
      <div></div>
    </section>

    <div class="divider"></div>

    <section class="body-section grid" data-ae="reveal">
      <div></div>
      <div>
        <h2>What Clocks Measure</h2>
        <p>A clock does not measure time. A clock generates regular events, and we count them. The identification of "what the clock counts" with "time itself" is a convenience that hardens into a doctrine when no one is looking.</p>
        <p>This is not a complaint, only a reminder. The instruments we trust to settle the question are themselves built inside the question.</p>
      </div>
      <aside class="aside">
        <div class="label">Further</div>
        <p>See Carlo Rovelli, <em>The Order of Time</em>, for a sympathetic reading of the relational view.</p>
      </aside>
    </section>
  </article>
</body>
</html>`,

  classifierHint: "narrative, biographical, conceptual, cultural, philosophical, history, language, society, art, literature, ethics, human stories",
};
