# AI Explain

Single-page web app where users ask questions and receive answers as visually unique HTML/CSS canvases rendered in a sandboxed iframe. Each answer uses a randomly selected style preset (10 themes with curated colors, fonts, and mood). A fast LLM preview provides a quick text answer while the full canvas generates.

## Stack

- **Framework:** Next.js 16.1.6 (App Router) + React 19 + TypeScript (strict)
- **Styling:** Tailwind CSS 4 (via PostCSS plugin) — dark theme, hex values in classNames
- **LLM:** OpenRouter API (three models: main for HTML canvas, fast for text preview + content planning, image model for AI-generated images)
- **Image Gen:** OpenRouter image generation via `modalities: ["image"]` (Seedream 4.5)
- **Validation:** Zod v4 (import from `zod/v4`)
- **Icons:** lucide-react (SVG only, never emojis)
- **Package manager:** npm

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint (core-web-vitals + TypeScript)
npx tsc --noEmit # Type check without emitting
```

## Project Structure

```
src/
  app/
    layout.tsx                  # Server component — root layout, Inter font, dark bg
    page.tsx                    # Client component — main page, state, parallel fetch
    globals.css                 # Tailwind v4 import, fadeIn/skeleton animations
    api/
      explain/route.ts          # POST — three-stage pipeline (thinker + coder + images, 120s timeout)
      preview/route.ts          # POST — fast text preview (15s timeout)
  components/
    search-input.tsx            # Question input with Lucide icons
    canvas-frame.tsx            # Sandboxed iframe (sandbox="")
    loading-animation.tsx       # Skeleton shimmer
    preview-answer.tsx          # Quick text answer card
  lib/
    openrouter.ts               # OpenRouter fetch wrapper with configurable model/temp/tokens
    image-gen.ts                # OpenRouter image generation (modalities API, base64 data URLs)
    prompts.ts                  # Thinker + coder prompt builders
    styles.ts                   # 10 style presets + getRandomPreset()
  types/
    api.ts                      # Shared interfaces
```

## Environment Variables

```
OPENROUTER_API_KEY=           # OpenRouter API key
OPENROUTER_MODEL=             # Main model for HTML canvas generation
OPENROUTER_FAST_MODEL=        # Fast/cheap model for text preview + content planning
OPENROUTER_IMAGE_MODEL=       # Image generation model (e.g. bytedance-seed/seedream-4.5)
```

## Architecture

1. User submits question → `page.tsx` fires **two parallel requests**
2. `/api/preview` → fast model, 200 max tokens, plain text → shown immediately
3. `/api/explain` → three-stage pipeline:
   - **Stage 1 (Thinker):** fast model → structured content plan with sections, diagram descriptions, data points, and 0-2 image prompts
   - **Stage 2a (Coder):** main model + random style preset → renders content plan as HTML/CSS/SVG infographic with `<img data-image-id>` placeholders
   - **Stage 2b (Image Gen):** image model → generates 0-2 images in parallel with coder (graceful degradation on failure)
   - **Stage 3 (Merge):** injects base64 data URIs into placeholders
4. Canvas HTML rendered in `<iframe srcDoc={html} sandbox="" />`
5. Preview fades to 40% opacity when canvas arrives

## Conventions

- **Imports:** Always use `@/` path alias (`@/components/...`, `@/lib/...`, `@/types/...`)
- **Components:** All UI components are client components (`"use client"`), only `layout.tsx` is server
- **Colors:** Dark theme with hex values in Tailwind classes (`bg-[#0B0F1A]`, `text-[#E2E8F0]`), accent cyan (`#06B6D4`/`#22D3EE`)
- **Font:** Inter (300-700) via `next/font/google`
- **No tests** — no test runner configured yet
- **No relative imports** between modules — always `@/` alias

## Security

- Iframe uses `sandbox=""` (most restrictive — no scripts, no forms, no same-origin)
- Zod validates all API inputs (1-500 chars)

## Style Presets

10 themes randomly selected per request: `midnight-scholar`, `warm-notebook`, `forest-green`, `sunset-coral`, `ocean-deep`, `lavender-dream`, `charcoal-minimal`, `terracotta`, `arctic-frost`, `golden-hour`. Each has colors (bg/text/accent/surface), Google Fonts pairing, and mood descriptor.

## Canvas Capabilities

The LLM-generated HTML supports:
- CSS `@keyframes` animations (fade-ins, staggered entrances, pulses)
- SVG diagrams (flowcharts, process diagrams, icons) with SMIL animations
- AI-generated images embedded as base64 data URIs in `<img>` tags
- Math formulas via Unicode symbols, `<sup>`/`<sub>`, CSS fractions
- Responsive layout (400-1400px), max content width 1200px

## Timeout Budget

| Stage | Timeout | Execution |
|-------|---------|-----------|
| Thinker | 20s | Sequential |
| Coder | 45s | Parallel |
| Image Gen | 30s | Parallel with coder |
| maxDuration | 120s | Route-level cap |
