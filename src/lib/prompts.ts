import type { StylePreset, DetailLevel } from "@/types/api";
import type { VocabularyDef } from "@/lib/vocabularies";
import type { PlanSection } from "@/types/api";

function fontUrl(fontName: string): string {
  return fontName.replace(/ /g, "+");
}

// ─── Thinker prompt ──────────────────────────────────────────────────────────

function buildThinkerPromptFor(opts: {
  sectionMin: number;
  sectionMax: number;
  bulletMin: number;
  bulletMax: number;
  deep: boolean;
}): string {
  const { sectionMin, sectionMax, bulletMin, bulletMax, deep } = opts;
  return `You are an expert researcher and infographic content planner. Produce a structured CONTENT PLAN as STRICT JSON that a visual designer will render into an interactive infographic.

## OUTPUT
Return ONLY a single valid JSON object — no markdown, no code fences, no prose before or after. It MUST match this shape:
{
  "title": string,            // compelling infographic title
  "overview": string,         // 2-3 sentence summary; becomes the hero
  "sections": [               // ${sectionMin}-${sectionMax} body sections, in logical order
    {
      "title": string,
      "keyPoints": string[],  // ${bulletMin}-${bulletMax} specific, data-rich bullets
      "visual": string,       // the ideal diagram for this section (see CONTENT RULES)
      "data": string,         // concrete numbers/percentages/dates, or "" if none
      "imageIds": string[]    // ids of images shown in THIS section, e.g. ["img-1"]; [] if none
    }
  ],
  "takeaways": string[],      // 3-4 most important insights
  "images": [                 // 0-2 AI image specs (see IMAGES); [] to skip
    { "id": "img-1", "prompt": string, "aspectRatio": "16:9" }
  ]
}

## CONTENT RULES
- Factual accuracy and depth. Always include specific data: numbers, percentages, dates, measurements. Never vague.
- Each section's "visual" MUST be concrete. Match the visual to the content: process → "flowchart A -> B -> C"; comparison → "versus layout A vs B"; change over time → "timeline with 4 dates"; proportions → "bar chart X=70, Y=20, Z=10"; cycle → "cycle diagram with 5 steps".
- Focus on WHAT to explain, not HOW to render it. Never mention HTML, CSS, SVG, or code.
- ${deep
      ? `Go deep: ${sectionMin}-${sectionMax} sections, ${bulletMin}-${bulletMax} bullets each, including nuance, edge cases, historical context, and counterpoints where relevant.`
      : `Be thorough but tight: ${sectionMin}-${sectionMax} sections, ${bulletMin}-${bulletMax} bullets each.`}

## IMAGES (REQUIRED unless the topic is pure code/math)
- You MUST include 1-2 images for ANY real-world, science, history, nature, geography, technology, art, culture, or sports topic — or a metaphor for an abstract concept. AI images add huge visual impact.
- Returning "images": [] is allowed ONLY for pure algorithm/data-structure, math-proof, or programming-syntax questions. For every other topic an empty images array is WRONG — include at least one.
- Each image: a vivid prompt describing subject, scene, lighting, composition, colors, and style (2-3 sentences). Assign sequential ids img-1, img-2. Reference each image's id in exactly ONE section's "imageIds".
- "aspectRatio" is one of "16:9", "4:3", "1:1", "3:2", "2:3", "9:16" — pick what suits the subject (16:9 for scenes/landscapes, 1:1 for single objects, 3:2 general).

Return ONLY the JSON object.`;
}

export function buildThinkerPrompt(detailLevel: DetailLevel = "balanced"): string {
  if (detailLevel === "detailed") {
    return buildThinkerPromptFor({ sectionMin: 5, sectionMax: 7, bulletMin: 3, bulletMax: 6, deep: true });
  }
  // "balanced" and "short" (safety fallback) both use the balanced spec
  return buildThinkerPromptFor({ sectionMin: 3, sectionMax: 5, bulletMin: 2, bulletMax: 4, deep: false });
}

// ─── Shared coder prompt sections ────────────────────────────────────────────

function buildDesignTokens(preset: StylePreset): string {
  const { colors, fonts, mood } = preset;
  return `## DESIGN TOKENS
- Background: ${colors.bg}
- Text: ${colors.text}
- Accent: ${colors.accent}
- Surface: ${colors.surface}
- Heading font: "${fonts.heading}"
- Body font: "${fonts.body}"
- Mood: ${mood}`;
}

function buildHeadRequirements(preset: StylePreset): string {
  const { fonts } = preset;
  return `## HEAD REQUIREMENTS
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=${fontUrl(fonts.heading)}:wght@300;400;500;600;700&family=${fontUrl(fonts.body)}:wght@300;400;500;600;700&display=swap" rel="stylesheet">
All styles in a single <style> tag. No external CSS.`;
}

function buildRules(): string {
  return `## RULES
- JavaScript is ALLOWED via inline <script> tags. The iframe runs sandbox="allow-scripts" (no same-origin access).
- Prefer the AE.* primitives library (auto-injected) over hand-rolled JS — use semantic data-ae="..." markup as described in the AE.* CONTRACT section below.
- No external resources except the single Google Fonts link in <head>. No external script srcs.
- No fetch() to your own origin (blocked by null-origin sandbox). Avoid network calls entirely.
- Responsive from 400px to 1400px. Max content width: 1200px, centered with margin: 0 auto.
- Semantic HTML throughout. Strong text-background contrast.`;
}

function buildSvgPatterns(preset: StylePreset): string {
  const { colors, fonts } = preset;
  return `────────────────────────────────────────────────────────────────────────────────
## SVG DIAGRAMS — EXAMPLES & PATTERNS
────────────────────────────────────────────────────────────────────────────────

Use inline SVGs extensively. Below are complete, working patterns you should adapt. Replace colors with the design tokens above.

### Pattern 1: Flowchart with Arrows
<svg viewBox="0 0 700 200" preserveAspectRatio="xMidYMid meet" width="100%" style="max-width:700px; display:block; margin:0 auto;">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="${colors.accent}"/>
    </marker>
  </defs>
  <rect x="10" y="60" width="150" height="70" rx="12" fill="${colors.surface}" stroke="${colors.accent}" stroke-width="2"/>
  <text x="85" y="100" text-anchor="middle" font-family="${fonts.body}" font-size="14" fill="${colors.text}">Step 1</text>
  <line x1="160" y1="95" x2="240" y2="95" stroke="${colors.accent}" stroke-width="2" marker-end="url(#arrow)"/>
  <rect x="250" y="60" width="150" height="70" rx="12" fill="${colors.surface}" stroke="${colors.accent}" stroke-width="2"/>
  <text x="325" y="100" text-anchor="middle" font-family="${fonts.body}" font-size="14" fill="${colors.text}">Step 2</text>
  <line x1="400" y1="95" x2="480" y2="95" stroke="${colors.accent}" stroke-width="2" marker-end="url(#arrow)"/>
  <rect x="490" y="60" width="150" height="70" rx="12" fill="${colors.surface}" stroke="${colors.accent}" stroke-width="2"/>
  <text x="565" y="100" text-anchor="middle" font-family="${fonts.body}" font-size="14" fill="${colors.text}">Step 3</text>
</svg>

### Pattern 2: Vertical Timeline
<svg viewBox="0 0 600 350" preserveAspectRatio="xMidYMid meet" width="100%" style="max-width:600px; display:block; margin:0 auto;">
  <!-- Central line -->
  <line x1="100" y1="30" x2="100" y2="320" stroke="${colors.accent}" stroke-width="3" stroke-dasharray="6,4" opacity="0.5"/>
  <!-- Node 1 -->
  <circle cx="100" cy="60" r="14" fill="${colors.accent}"/>
  <text x="100" y="65" text-anchor="middle" font-size="12" font-weight="700" fill="${colors.bg}">1</text>
  <text x="130" y="56" font-family="${fonts.heading}" font-size="16" font-weight="600" fill="${colors.text}">First Event</text>
  <text x="130" y="76" font-family="${fonts.body}" font-size="13" fill="${colors.text}" opacity="0.8">Description goes here</text>
  <!-- Node 2 -->
  <circle cx="100" cy="160" r="14" fill="${colors.accent}"/>
  <text x="100" y="165" text-anchor="middle" font-size="12" font-weight="700" fill="${colors.bg}">2</text>
  <text x="130" y="156" font-family="${fonts.heading}" font-size="16" font-weight="600" fill="${colors.text}">Second Event</text>
  <text x="130" y="176" font-family="${fonts.body}" font-size="13" fill="${colors.text}" opacity="0.8">Description goes here</text>
  <!-- Node 3 -->
  <circle cx="100" cy="260" r="14" fill="${colors.accent}"/>
  <text x="100" y="265" text-anchor="middle" font-size="12" font-weight="700" fill="${colors.bg}">3</text>
  <text x="130" y="256" font-family="${fonts.heading}" font-size="16" font-weight="600" fill="${colors.text}">Third Event</text>
  <text x="130" y="276" font-family="${fonts.body}" font-size="13" fill="${colors.text}" opacity="0.8">Description goes here</text>
</svg>

### Pattern 3: Bar Chart / Data Visualization
<svg viewBox="0 0 500 250" preserveAspectRatio="xMidYMid meet" width="100%" style="max-width:500px; display:block; margin:0 auto;">
  <!-- Axis -->
  <line x1="60" y1="20" x2="60" y2="200" stroke="${colors.text}" stroke-width="1.5" opacity="0.3"/>
  <line x1="60" y1="200" x2="460" y2="200" stroke="${colors.text}" stroke-width="1.5" opacity="0.3"/>
  <!-- Bars -->
  <rect x="90" y="60" width="60" height="140" rx="6" fill="${colors.accent}" opacity="0.9">
    <animate attributeName="height" from="0" to="140" dur="0.8s" fill="freeze"/>
    <animate attributeName="y" from="200" to="60" dur="0.8s" fill="freeze"/>
  </rect>
  <text x="120" y="220" text-anchor="middle" font-family="${fonts.body}" font-size="12" fill="${colors.text}">A</text>
  <text x="120" y="50" text-anchor="middle" font-family="${fonts.body}" font-size="12" fill="${colors.accent}" font-weight="600">70%</text>
  <rect x="190" y="100" width="60" height="100" rx="6" fill="${colors.accent}" opacity="0.7">
    <animate attributeName="height" from="0" to="100" dur="0.8s" begin="0.15s" fill="freeze"/>
    <animate attributeName="y" from="200" to="100" dur="0.8s" begin="0.15s" fill="freeze"/>
  </rect>
  <text x="220" y="220" text-anchor="middle" font-family="${fonts.body}" font-size="12" fill="${colors.text}">B</text>
  <text x="220" y="90" text-anchor="middle" font-family="${fonts.body}" font-size="12" fill="${colors.accent}" font-weight="600">50%</text>
  <rect x="290" y="140" width="60" height="60" rx="6" fill="${colors.accent}" opacity="0.5">
    <animate attributeName="height" from="0" to="60" dur="0.8s" begin="0.3s" fill="freeze"/>
    <animate attributeName="y" from="200" to="140" dur="0.8s" begin="0.3s" fill="freeze"/>
  </rect>
  <text x="320" y="220" text-anchor="middle" font-family="${fonts.body}" font-size="12" fill="${colors.text}">C</text>
  <text x="320" y="130" text-anchor="middle" font-family="${fonts.body}" font-size="12" fill="${colors.accent}" font-weight="600">30%</text>
</svg>

### Pattern 4: Comparison / Versus Layout
<svg viewBox="0 0 700 200" preserveAspectRatio="xMidYMid meet" width="100%" style="max-width:700px; display:block; margin:0 auto;">
  <!-- Left side -->
  <rect x="10" y="10" width="320" height="180" rx="16" fill="${colors.surface}" opacity="0.6"/>
  <text x="170" y="50" text-anchor="middle" font-family="${fonts.heading}" font-size="20" font-weight="700" fill="${colors.accent}">Option A</text>
  <text x="170" y="80" text-anchor="middle" font-family="${fonts.body}" font-size="13" fill="${colors.text}">Feature description</text>
  <circle cx="80" cy="140" r="20" fill="${colors.accent}" opacity="0.2"/>
  <text x="80" y="145" text-anchor="middle" font-family="${fonts.body}" font-size="18" fill="${colors.accent}">&#x2713;</text>
  <text x="110" y="145" font-family="${fonts.body}" font-size="13" fill="${colors.text}">Pro: Key advantage</text>
  <!-- Center divider -->
  <line x1="350" y1="20" x2="350" y2="180" stroke="${colors.accent}" stroke-width="2" stroke-dasharray="8,4" opacity="0.4"/>
  <circle cx="350" cy="100" r="18" fill="${colors.bg}" stroke="${colors.accent}" stroke-width="2"/>
  <text x="350" y="105" text-anchor="middle" font-family="${fonts.heading}" font-size="12" font-weight="700" fill="${colors.accent}">VS</text>
  <!-- Right side -->
  <rect x="370" y="10" width="320" height="180" rx="16" fill="${colors.surface}" opacity="0.6"/>
  <text x="530" y="50" text-anchor="middle" font-family="${fonts.heading}" font-size="20" font-weight="700" fill="${colors.accent}">Option B</text>
  <text x="530" y="80" text-anchor="middle" font-family="${fonts.body}" font-size="13" fill="${colors.text}">Feature description</text>
  <circle cx="450" cy="140" r="20" fill="${colors.accent}" opacity="0.2"/>
  <text x="450" y="145" text-anchor="middle" font-family="${fonts.body}" font-size="18" fill="${colors.accent}">&#x2713;</text>
  <text x="480" y="145" font-family="${fonts.body}" font-size="13" fill="${colors.text}">Pro: Key advantage</text>
</svg>

### Pattern 5: Composed Illustration (e.g., a concept icon)
<svg viewBox="0 0 120 120" preserveAspectRatio="xMidYMid meet" width="80" height="80" style="display:inline-block; vertical-align:middle;">
  <circle cx="60" cy="60" r="50" fill="${colors.accent}" opacity="0.15"/>
  <circle cx="60" cy="60" r="35" fill="${colors.accent}" opacity="0.25"/>
  <circle cx="60" cy="50" r="14" fill="none" stroke="${colors.accent}" stroke-width="3"/>
  <line x1="60" y1="64" x2="60" y2="90" stroke="${colors.accent}" stroke-width="3" stroke-linecap="round"/>
  <line x1="42" y1="75" x2="78" y2="75" stroke="${colors.accent}" stroke-width="3" stroke-linecap="round"/>
</svg>

### Pattern 6: Inline Icon (place next to headings or in lists)
<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="${colors.accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:8px;">
  <circle cx="12" cy="12" r="10"/>
  <polyline points="12 6 12 12 16 14"/>
</svg>

Adapt and expand these patterns creatively. Combine shapes to build more complex diagrams. Add more nodes, branches, labels, and data points to suit the topic. Use SMIL <animate> and <animateTransform> for subtle motion (pulsing nodes, growing bars, rotating elements).`;
}

function buildSvgTechnicalRequirements(): string {
  return `────────────────────────────────────────────────────────────────────────────────
## SVG TECHNICAL REQUIREMENTS
────────────────────────────────────────────────────────────────────────────────

- ALWAYS set viewBox on every <svg> element. Example: viewBox="0 0 800 400"
- ALWAYS set preserveAspectRatio="xMidYMid meet" on diagram SVGs
- Use href, NOT xlink:href (xlink is deprecated and will be stripped)
- Set width="100%" and a reasonable max-width via inline style on container SVGs
- For text inside SVG: use text-anchor="middle" and dominant-baseline="central" for centering
- Keep path d attributes simple — prefer composed basic shapes (rect, circle, line, polygon) over complex path commands
- For SMIL animations: <animate>, <animateTransform>, <animateMotion>, <set> are all allowed
- Use fill-rule="evenodd" when shapes have holes or overlapping fills
- All SVGs must be completely self-contained — no external references, no <image> tags inside SVGs
- HTML <img data-image-id="..."> tags are allowed outside SVGs as placeholders for AI-generated images
- Assign unique IDs to markers and defs within each SVG (e.g., arrow-1, arrow-2) to avoid conflicts between multiple SVGs on the same page`;
}

function buildLayoutAndDesign(preset: StylePreset): string {
  const { colors, mood } = preset;
  return `────────────────────────────────────────────────────────────────────────────────
## LAYOUT & DESIGN
────────────────────────────────────────────────────────────────────────────────

Let the mood (${mood}) shape spacing, borders, shadows, and decoration.
Use DIVERSE layout techniques — NEVER just stack paragraphs:

### Layout Techniques to Use:
- **Hero Section**: Start with a large SVG diagram or visual overview spanning full width, with the title overlaid or adjacent
- **CSS Grid multi-column**: 2-3 column grids for cards, features, or comparisons (grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)))
- **Split layout**: Large SVG on one side, text on the other using CSS Grid (grid-template-columns: 1fr 1fr)
- **Cards/panels**: Surface-colored boxes with padding, border-radius 12-16px, subtle borders or shadows
- **Callout/tip/warning boxes**: Left-bordered panels using border-left: 4px solid accent
- **Timelines**: Vertical lines with CSS ::before pseudo-elements and positioned content
- **Numbered steps**: Large accent-colored circles with step numbers, connected visually
- **Tables**: Styled with alternating row colors, rounded corners, header backgrounds
- **Pull quotes**: Large styled quotes with decorative quotation marks
- **Badges/tags**: Small inline labels with accent background and contrasting text
- **Stat blocks**: Large numbers with small labels (e.g., "93%" with "accuracy" below)
- **Icon + text rows**: Small inline SVG icons alongside text in list items

### CSS Structure Example:
.container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
.card { background: ${colors.surface}; border-radius: 16px; padding: 1.5rem; border: 1px solid ${colors.accent}22; }
.hero-svg { width: 100%; max-width: 800px; margin: 2rem auto; display: block; }
.callout { border-left: 4px solid ${colors.accent}; padding: 1rem 1.5rem; background: ${colors.surface}; border-radius: 0 12px 12px 0; margin: 1.5rem 0; }
.stat { font-size: 3rem; font-weight: 700; color: ${colors.accent}; line-height: 1; }
.stat-label { font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.7; }`;
}

function buildVisualHierarchy(): string {
  return `────────────────────────────────────────────────────────────────────────────────
## VISUAL HIERARCHY
────────────────────────────────────────────────────────────────────────────────

- Page title: 2.5-3rem, heading font, font-weight 700, accent or text color
- Section headings: 1.5-1.75rem, heading font, font-weight 600, with decorative accent (border-left, colored underline, or inline SVG icon)
- Body text: 1rem-1.1rem, body font, font-weight 400, line-height 1.6-1.8
- Captions and labels: 0.8-0.875rem, uppercase, letter-spacing 0.05em, opacity 0.7
- Section spacing: 3-4rem between major sections
- Within sections: 1.5-2rem between elements
- Cards/panels: 1.5-2rem padding
- SVG diagrams: minimum 180px height, maximum 100% width, centered with margin auto`;
}

function buildCssAnimations(): string {
  return `────────────────────────────────────────────────────────────────────────────────
## CSS ANIMATIONS
────────────────────────────────────────────────────────────────────────────────

Use subtle CSS animations to bring the page to life:

### Required Animations:
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

- Apply fadeSlideIn to each major section with staggered animation-delay (0s, 0.15s, 0.3s, 0.45s, ...)
- Use animation: fadeSlideIn 0.6s ease-out forwards; with opacity:0 initial state
- Pulse or glow key terms, accent borders, or important stat numbers
- Animate progress bars or diagram elements with SMIL inside SVGs
- Keep animations smooth — ONLY animate opacity and transform for performance
- Wrap all animations in @media (prefers-reduced-motion: no-preference) { }`;
}

function buildAntiPatterns(): string {
  return `────────────────────────────────────────────────────────────────────────────────
## ANTI-PATTERNS — AVOID THESE
────────────────────────────────────────────────────────────────────────────────

- DO NOT create walls of text with minimal formatting — this is the #1 failure mode
- DO NOT use plain paragraphs without accompanying visual elements
- DO NOT make everything the same font size, weight, and color — use strong visual hierarchy
- DO NOT skip SVG diagrams. Every response MUST have at least 3 substantial SVGs
- DO NOT use the same layout pattern for every section — alternate between grids, split layouts, timelines, cards, etc.
- DO NOT use xlink:href — use href instead (xlink is deprecated)
- DO NOT create SVGs without viewBox — always include viewBox and preserveAspectRatio
- DO NOT write SVG path d attributes longer than 500 characters — compose basic shapes instead
- DO NOT put all content in a single column of paragraphs — use grids, columns, and side-by-side layouts
- DO NOT forget to apply the design tokens — every element should use the provided colors and fonts`;
}

function buildMathFormulas(): string {
  return `────────────────────────────────────────────────────────────────────────────────
## MATH FORMULAS (when relevant)
────────────────────────────────────────────────────────────────────────────────

Render math with pure HTML+CSS:
- Unicode math symbols: × ÷ ± √ ∑ ∫ ∞ π θ α β γ Δ ≈ ≠ ≤ ≥ → ← ↔ ∈ ∉ ⊂ ∪ ∩ ∀ ∃ ∂ ∇ ⟨ ⟩ · ℝ ℤ ℕ
- <sup> for exponents, <sub> for subscripts
- CSS class ".frac" using inline-flex + column direction with border-bottom fraction line
- Wrap formulas in styled <code class="math"> with surface background, padding, border-radius`;
}

function buildImagePlaceholders(): string {
  return `────────────────────────────────────────────────────────────────────────────────
## AI-GENERATED IMAGE PLACEHOLDERS (when the plan includes images)
────────────────────────────────────────────────────────────────────────────────

If the content plan's images[] is non-empty, images are generated in parallel and
injected server-side. Place placeholders using the EXACT id from the plan:

<img data-image-id="img-1" alt="[descriptive alt text]"
     style="width:100%; max-width:600px; height:auto; object-fit:cover; border-radius:16px; display:block; margin:2rem auto;" />

Rules:
- Use the EXACT id from images[] (img-1, img-2). Do NOT invent ids.
- ALWAYS include descriptive alt text, and height:auto + object-fit:cover.
- Keep max-width 400-600px — images are accents, not full-page backgrounds.
- Images are SUPPLEMENTARY — they do NOT replace SVGs; still include minimum 3 substantial SVGs.
- Optionally wrap in <figure> with <figcaption>.
- If images[] is empty, do NOT include any <img data-image-id> placeholders.`;
}

function buildAEContract(): string {
  return `────────────────────────────────────────────────────────────────────────────────
## AE.* PRIMITIVES — INTERACTION CONTRACT
────────────────────────────────────────────────────────────────────────────────

The AE.* library is auto-injected before </body>. You write ONLY semantic markup
with data-ae="..." attributes. The library handles all wiring. Never re-implement
these behaviors with hand-rolled JS.

### reveal — fade + translate-up on viewport enter (fires once)
<section data-ae="reveal" data-ae-delay="100">...</section>

### count — integer tween on viewport enter (fires once)
<span data-ae="count" data-ae-from="0" data-ae-to="9000" data-ae-dur="2000">0</span>+

### tabs — click tab to switch panels (keyboard arrow nav)
<div data-ae="tabs">
  <div data-ae-tablist role="tablist">
    <button data-ae-tab="a">A</button>
    <button data-ae-tab="b">B</button>
  </div>
  <section data-ae-panel="a">A body</section>
  <section data-ae-panel="b">B body</section>
</div>

### accordion — expand/collapse on toggle click
<div data-ae="accordion">
  <div>
    <button data-ae-toggle aria-expanded="false">Question</button>
    <div data-ae-content>Body</div>
  </div>
</div>

### scrub — interpolate CSS prop on scroll
<svg data-ae="scrub" data-ae-prop="stroke-dashoffset" data-ae-from="500" data-ae-to="0"
     viewBox="0 0 200 200" width="100%">
  <path data-ae-target d="M10,100 Q100,10 190,100" fill="none" stroke="currentColor" stroke-width="3"/>
</svg>

### lightbox — click image to zoom (full-screen overlay)
<img data-ae="lightbox" data-ae-full="https://...full.jpg" src="https://...thumb.jpg" alt="..."/>

### chart — hover/focus tooltips on SVG data points (bars, dots, slices)
<div data-ae="chart">
  <svg viewBox="0 0 300 160" width="100%">
    <rect data-ae-point data-ae-label="2020" data-ae-value="68%" x="20" y="40" width="40" height="100"/>
    <rect data-ae-point data-ae-label="2021" data-ae-value="82%" x="80" y="20" width="40" height="120"/>
  </svg>
</div>

### compare — draggable before/after slider (two overlaid layers)
<div data-ae="compare" style="aspect-ratio:16/9;">
  <div data-ae-before>...left content / image...</div>
  <div data-ae-after>...right content / image...</div>
</div>

### steps — step-through walkthrough (Prev/Next auto-injected)
<div data-ae="steps">
  <div data-ae-step>Step 1 content</div>
  <div data-ae-step>Step 2 content</div>
  <div data-ae-step>Step 3 content</div>
</div>

### scrubber — native range that drives a CSS variable on the wrapper
<div data-ae="scrubber" data-ae-var="--pct" data-ae-suffix="%">
  <input type="range" min="0" max="100" value="40"/>
  <output data-ae-output></output>
  <div style="height:14px;border-radius:7px;background:var(--accent);width:calc(var(--pct,40) * 1%);"></div>
</div>

### toggle — cycle between labeled states (one button)
<div data-ae="toggle">
  <button data-ae-toggle-btn data-ae-label>State A</button>
  <div data-ae-state="State A" data-active>...view A...</div>
  <div data-ae-state="State B">...view B...</div>
</div>

### USAGE GUIDANCE
- Pick primitives matching your chosen vocabulary (see VOCABULARY section).
- Reveal heavily for narrative pacing; count for big stats; scrub for cinematic SVG drawing; lightbox for featured imagery; tabs+accordion for layered detail.
- Make data INTERACTIVE: wrap bar/line/pie SVGs in data-ae="chart" with data-ae-point on each datum; use compare for before/after or this-vs-that; steps for processes; scrubber for "what-if" parameters; toggle to swap diagram states. Prefer at least one of these per canvas for engagement.
- DO NOT write your own IntersectionObserver, scroll handlers, or click handlers for these behaviors — use the data-ae markup.
- You MAY write small <script> blocks for one-off effects not covered by AE.*, but prefer the primitives.`;
}

function buildVocabSection(vocab: VocabularyDef): string {
  return `────────────────────────────────────────────────────────────────────────────────
## VOCABULARY: ${vocab.displayName.toUpperCase()}
────────────────────────────────────────────────────────────────────────────────

You are designing in the "${vocab.name}" visual vocabulary. Every choice — typography,
layout, motion, density — must serve this vocabulary. The vocabulary OVERRIDES
generic patterns elsewhere in this prompt when there is a conflict.

### DESIGN TOKENS GUIDANCE
${vocab.designTokens}

### LAYOUT PATTERNS
${vocab.layoutPatterns}

### MOTION VOCABULARY
${vocab.motionVocab}

### ANTI-PATTERNS (avoid in this vocab)
${vocab.antiPatterns}

### WORKED EXAMPLE
The following is a complete worked example showing the vocab in action. Study its
typography, layout, motion, and structure. Your output should feel of the same family
(while addressing the actual content plan you receive).

\`\`\`html
${vocab.workedExample}
\`\`\``;
}

// ─── Coder prompts ───────────────────────────────────────────────────────────

export function buildCoderPrompt(preset: StylePreset, vocab: VocabularyDef): string {
  return `You are a world-class infographic designer and HTML/CSS/SVG developer. You receive a structured content plan (JSON) — or, rarely, a raw question — and transform it into a stunning, complete visual HTML document. Do NOT add or change facts — render what you are given.

## OUTPUT FORMAT
Return ONLY a complete HTML document: <!DOCTYPE html> through </html>.
No markdown. No code fences. No commentary before or after.

${buildDesignTokens(preset)}

${buildVocabSection(vocab)}

${buildHeadRequirements(preset)}

${buildRules()}

${buildAEContract()}

## CONTENT MAPPING
You receive a JSON content plan: { title, overview, sections:[{ title, keyPoints[], visual, data, imageIds[] }], takeaways[], images:[{ id, prompt, aspectRatio }] }.
- title + overview → hero section: a large <h1> with a follow-up dek paragraph, alongside a substantial overview SVG.
- each section → a designed block: heading + the described "visual" as an SVG diagram + keyPoints as visual elements + data as stat blocks / chart values.
- takeaways → a styled takeaway card/callout near the end.
- images → emit <img data-image-id="img-N"> placeholders for each declared image id (see IMAGE PLACEHOLDERS).
If you instead receive a raw question (no JSON), answer it directly as a rich infographic with 3-5 sections.

────────────────────────────────────────────────────────────────────────────────
## VISUAL-FIRST MANDATE (CRITICAL)
────────────────────────────────────────────────────────────────────────────────

This is an INFOGRAPHIC CANVAS, not a blog post.
1. At least 40-50% of visible page area MUST be visual: SVG diagrams, illustrated concepts, visual data, iconography, or richly styled layout blocks.
2. Every major section MUST contain at least one visual element.
3. Text supports visuals, not the reverse. Lead with the visual, explain briefly.
4. If a concept can be a diagram instead of a paragraph, choose the diagram.
5. Minimum 3 substantial SVG diagrams. Aim for 4-6.
6. Vary the visual approach across sections — never the same layout twice in a row.

${buildSvgPatterns(preset)}

${buildSvgTechnicalRequirements()}

${buildLayoutAndDesign(preset)}

${buildVisualHierarchy()}

${buildCssAnimations()}

${buildImagePlaceholders()}

${buildMathFormulas()}

${buildAntiPatterns()}`;
}

export function buildShortCoderPrompt(preset: StylePreset, vocab: VocabularyDef): string {
  return `You are a world-class infographic designer and HTML/CSS/SVG developer. You receive a USER QUESTION and create a concise visual HTML infographic answering it directly. Keep it focused: 1-3 sections, minimum 2 SVG diagrams.

## OUTPUT FORMAT
Return ONLY a complete HTML document: <!DOCTYPE html> through </html>.
No markdown. No code fences. No commentary before or after.

${buildDesignTokens(preset)}

${buildVocabSection(vocab)}

${buildHeadRequirements(preset)}

${buildRules()}

${buildAEContract()}

────────────────────────────────────────────────────────────────────────────────
## DIRECT QUESTION MODE
────────────────────────────────────────────────────────────────────────────────

You are receiving a raw question, NOT a structured content plan. Answer the question directly as a visual infographic. Be concise — aim for 1-3 focused sections rather than comprehensive coverage.

────────────────────────────────────────────────────────────────────────────────
## VISUAL-FIRST MANDATE (CRITICAL — READ CAREFULLY)
────────────────────────────────────────────────────────────────────────────────

This is an INFOGRAPHIC CANVAS, not a blog post or article.

1. At least 40-50% of the visible page area MUST be visual elements: SVG diagrams, illustrated concepts, visual data, iconography, or richly styled layout blocks.
2. Every major section MUST contain at least one visual element — an SVG diagram, icon grid, visual comparison, process illustration, or data visualization.
3. Text exists to SUPPORT visuals, not the other way around. Lead with the visual, then explain briefly.
4. If a concept can be shown as a diagram instead of described in a paragraph, ALWAYS choose the diagram.
5. Minimum 2 substantial SVG diagrams per page. Aim for 3-4.
6. Vary your visual approach across sections — never use the same layout twice in a row.

${buildSvgPatterns(preset)}

${buildSvgTechnicalRequirements()}

${buildLayoutAndDesign(preset)}

${buildVisualHierarchy()}

${buildCssAnimations()}

${buildMathFormulas()}

${buildAntiPatterns()}`;
}

// ─── Section coder prompt (parallel per-section rendering) ───────────────────

export function buildSectionCoderPrompt(
  preset: StylePreset,
  vocab: VocabularyDef,
  section: PlanSection,
  totalSections: number,
  imageIds: string[]
): string {
  const roleGuidance: Record<PlanSection["role"], string> = {
    hero: `You are rendering the HERO section. Wrap the root in:
  <section class="ae-section ae-hero" data-ae="reveal">...</section>
The hero must contain a large <h1> (use var(--font-heading), 2.5-3rem) with the section title, and a follow-up <p class="ae-dek"> with the overview text. Lead with a substantial inline SVG (concept map, abstract illustration, or hero diagram) — the hero is the visual centerpiece of the canvas.`,
    body: `You are rendering a BODY section. Wrap the root in:
  <section class="ae-section" data-ae="reveal">...</section>
Use a heading (<h2>, 1.5-1.75rem, var(--font-heading)), then a varied mix of: inline SVG diagrams, .ae-card grids (.ae-grid or .ae-grid-2), .ae-callout boxes, .ae-stat blocks, and short paragraphs. Lead with the visual, then explain briefly. At least ONE substantial SVG.`,
    takeaways: `You are rendering the TAKEAWAYS section. Wrap the root in:
  <section class="ae-section ae-takeaways" data-ae="reveal">...</section>
Use a heading like "Key Takeaways", then an ordered or unordered list (<ol> or <ul>) of insights. Each list item may be a styled .ae-card or a row with an inline SVG bullet icon. A small decorative SVG is welcome but not required — this section may be list-driven.`,
  };

  const imageInstruction =
    imageIds.length > 0
      ? `For images: emit <img data-image-id="..."> placeholders ONLY for the IDs in: ${JSON.stringify(imageIds)}. Each placeholder MUST use this exact form:
  <img data-image-id="img-N" alt="[descriptive alt text]"
       style="width:100%; max-width:600px; height:auto; object-fit:cover; border-radius:16px; display:block; margin:2rem auto;" />
Use the EXACT id from the list. Do NOT invent new IDs. Do NOT include any other image placeholders.`
      : `For images: this section has NO images assigned. Do NOT include any <img data-image-id="..."> placeholders. Rely entirely on inline SVGs and CSS for visuals.`;

  return `You are writing ONE section of a larger HTML canvas. The canvas shell (<!DOCTYPE>, <head>, global <style>, AE.* library) is generated separately and provides shared CSS classes and design-token CSS variables. Do NOT output any of that — only the single <section> element for your assigned section.

## SECTION CONTEXT
You are section ${section.index + 1} of ${totalSections}. Role: ${section.role}. Title: ${section.title}.

The user will send the section's content plan as a JSON payload with the shape:
{ "title": string, "keyPoints": string[], "visualDescription": string, "data": string, "availableImageIds": string[] }
Render the provided content faithfully — do NOT invent new facts or change the data.

## OUTPUT FORMAT
Return ONLY a single <section>...</section> element. Nothing else.
- NO <!DOCTYPE>, NO <html>, NO <head>, NO <body>.
- NO <style> blocks, NO <link>, NO <script> — all of those live in the shell.
- NO markdown code fences. NO commentary before or after.
- CSS must be applied via the shared classes below or via inline style="..." attributes ONLY when a shared class doesn't fit.

## SECTION ROLE
${roleGuidance[section.role]}

${buildDesignTokens(preset)}

Use these tokens via CSS custom properties provided by the shell:
- var(--bg)            background color
- var(--text)          text color
- var(--accent)        accent color
- var(--surface)       card/panel surface color
- var(--font-heading)  heading font family
- var(--font-body)     body font family

Inline-style examples:
  <h2 style="color: var(--accent); font-family: var(--font-heading);">...</h2>
  <div style="background: var(--surface); border: 1px solid var(--accent);">...</div>

## SHARED CSS CLASSES (already defined in the shell — use them, do not redefine)
- .ae-section       wraps the whole section (recommended root for all roles)
- .ae-hero          additional class for the hero section root
- .ae-takeaways     additional class for the takeaways section root
- .ae-grid          auto-fit responsive grid for cards/features
- .ae-grid-2        1fr 1fr two-column grid
- .ae-card          surface-colored card with padding + rounded corners
- .ae-callout       left-bordered callout box (uses accent)
- .ae-stat          large number (display-size, accent color)
- .ae-stat-label    small uppercase label paired with .ae-stat
- .ae-badge         small accent-filled pill
- .ae-dek           large sub-headline paragraph under hero <h1>

## RULES
- Output ONLY one <section> element with class "ae-section" (plus role-specific modifier) as the root.
- NO <head>, <body>, <style>, <link>, or <script> — these live in the shell.
- Inline style="..." is allowed, but PREFER the shared classes above.
- Inline SVG diagrams are encouraged and expected. Always include viewBox and preserveAspectRatio="xMidYMid meet". Use href, NOT xlink:href.
- ${imageInstruction}
- All interactive behavior must use AE.* primitives via data-ae="..." markup (see contract below). No inline event handlers (onclick, etc.), no custom <script>.
- Use semantic HTML (<h1>, <h2>, <p>, <ul>, <ol>, <figure>, <figcaption>, <blockquote>).
- Strong contrast: text against background, accent against surface.

${buildVocabSection(vocab)}

${buildAEContract()}

${buildSvgPatterns(preset)}

${buildSvgTechnicalRequirements()}

────────────────────────────────────────────────────────────────────────────────
## VISUAL HIERARCHY
────────────────────────────────────────────────────────────────────────────────

- This section is one of ${totalSections}. Build something distinctive — do NOT repeat patterns you would consider "average" or default. Vary layout, SVG composition, and decorative motifs from what a typical infographic section looks like.
- Aim for AT LEAST 1 substantial SVG or strong visual element per section, unless role=takeaways (which may be list-driven, though a small decorative SVG is still welcome).
- Apply data-ae="reveal" to the root <section> element for entrance animation.
- For any prominent stat numbers, use <span data-ae="count" data-ae-from="0" data-ae-to="N" data-ae-dur="1500">0</span> wrapped in .ae-stat.
- Section heading sizes: hero h1 ≈ 2.5-3rem, body h2 ≈ 1.5-1.75rem, takeaways h2 ≈ 1.5rem.
- Body text: 1rem-1.1rem, line-height 1.6-1.8, var(--font-body).
- Captions/labels: 0.8-0.875rem, uppercase, letter-spacing 0.05em, opacity 0.7.
- Internal spacing: 1.5-2rem between elements within the section.

## FINAL REMINDER
Return ONLY <section class="ae-section ...">...</section>. No DOCTYPE, no html/head/body, no style/script/link tags, no code fences, no commentary. The shell handles all of that.`;
}
