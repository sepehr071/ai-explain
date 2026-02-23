# AI Explain

Single-page web app where users ask questions and receive answers as visually unique HTML/CSS canvases rendered in a sandboxed iframe. Users control answer depth (Short/Balanced/Detailed) with OpenRouter reasoning tokens, customize visual style (accent color, font, light/dark mode), browse history, and export canvases as PNG/PDF.

## Stack

- **Framework:** Next.js 16.1.6 (App Router) + React 19 + TypeScript (strict)
- **Styling:** Tailwind CSS 4 (via PostCSS plugin) — dark theme, hex values in classNames
- **LLM:** OpenRouter API (three models: main for HTML canvas, fast for text preview + content planning, image model for AI-generated images)
- **LLM Reasoning:** OpenRouter `reasoning.effort` parameter (none/medium/high) scales with detail level
- **Image Gen:** OpenRouter image generation via `modalities: ["image"]` (Seedream 4.5)
- **Export:** html2canvas-pro (PNG capture) + jsPDF (PDF generation) — client-side only
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
    globals.css                 # Tailwind v4 import, fadeIn/skeleton/slideInRight animations
    api/
      explain/route.ts          # POST — detail-level-aware pipeline (120s timeout)
      preview/route.ts          # POST — fast text preview (15s timeout)
  components/
    search-input.tsx            # Question input with Lucide icons
    canvas-frame.tsx            # Sandboxed iframe (sandbox="")
    loading-animation.tsx       # Skeleton shimmer
    preview-answer.tsx          # Quick text answer card
    detail-level-selector.tsx   # Short/Balanced/Detailed chip buttons
    style-customizer.tsx        # Accent color, font, light/dark mode panel
    history-gallery.tsx         # Right-side overlay with canvas thumbnails
    history-thumbnail.tsx       # Scaled iframe preview for gallery cards
    export-button.tsx           # PNG/PDF download buttons
  lib/
    openrouter.ts               # OpenRouter fetch wrapper with reasoning support
    image-gen.ts                # OpenRouter image generation (modalities API, base64 data URLs)
    prompts.ts                  # Thinker + coder + short-coder prompt builders
    styles.ts                   # 10 style presets + getRandomPreset() + font pairings
    style-utils.ts              # Color derivation (hex↔HSL), custom preset builder
    history.ts                  # localStorage CRUD, LRU eviction, relative timestamps
    export.ts                   # html2canvas-pro + jsPDF export with HTML sanitization
  types/
    api.ts                      # Shared interfaces (DetailLevel, CustomStyle, StylePreset, etc.)
```

## Environment Variables

```
OPENROUTER_API_KEY=           # OpenRouter API key
OPENROUTER_MODEL=             # Main model for HTML canvas generation (e.g. Gemini Flash 3)
OPENROUTER_FAST_MODEL=        # Fast model for text preview + content planning (e.g. Grok 4 Fast)
OPENROUTER_IMAGE_MODEL=       # Image generation model (e.g. bytedance-seed/seedream-4.5)
```

## Architecture

1. User submits question → `page.tsx` fires **two parallel requests**
2. `/api/preview` → fast model, 200 max tokens, plain text → shown immediately
3. `/api/explain` → detail-level-aware pipeline:

### Short Mode
- Skips thinker entirely, sends question directly to coder with `buildShortCoderPrompt`
- No images, no reasoning tokens
- Coder: 12K max tokens, 30s timeout

### Balanced Mode (default)
- **Stage 1 (Thinker):** fast model + medium reasoning → structured content plan (3-5 sections, 3-6 diagrams, 0-2 image prompts)
- **Stage 2a (Coder):** main model + medium reasoning + style preset → HTML/CSS/SVG infographic
- **Stage 2b (Image Gen):** 0-2 images in parallel with coder (graceful degradation)
- **Stage 3 (Merge):** injects base64 data URIs into placeholders

### Detailed Mode
- Same pipeline as Balanced but with high reasoning effort
- Enhanced thinker prompt (5-7 sections, 5-8 diagrams, deeper analysis)
- Coder: 32K max tokens, 60s timeout

4. Canvas HTML rendered in `<iframe srcDoc={html} sandbox="" />`
5. Preview fades to 40% opacity when canvas arrives
6. Canvas auto-saved to localStorage history on success

## Features

### Detail Level Selector
Three chip buttons (Short/Balanced/Detailed) below search bar. Controls reasoning effort, token budgets, and pipeline complexity via OpenRouter's `reasoning.effort` parameter.

### Style Customizer
"Customize Style" panel with accent color picker, font pair dropdown (10 presets), and light/dark toggle. Colors auto-derived from accent via HSL conversion. Default: random preset.

### History & Gallery
Auto-saves to localStorage (4.5MB budget, LRU eviction). Right-side sliding panel with scaled iframe thumbnails, relative timestamps, and preset badges. Click to reload.

### Canvas Export
PNG and PDF download via html2canvas-pro + jsPDF. Two-phase rendering: (1) iframe renders the full HTML document for correct CSS resolution (body/html/:root selectors, cascade), (2) deep-cloned DOM + rewritten styles transferred to host document div for html2canvas capture. PDF uses multi-page A4-proportioned slicing for tall canvases. Google Fonts injected into host `<head>` for capture.

## Conventions

- **Imports:** Always use `@/` path alias (`@/components/...`, `@/lib/...`, `@/types/...`)
- **Components:** All UI components are client components (`"use client"`), only `layout.tsx` is server
- **Colors:** Dark theme with hex values in Tailwind classes (`bg-[#0B0F1A]`, `text-[#E2E8F0]`), accent cyan (`#06B6D4`/`#22D3EE`)
- **Font:** Inter (300-700) via `next/font/google`
- **No tests** — no test runner configured yet
- **No relative imports** between modules — always `@/` alias

## Security

- Iframe uses `sandbox=""` (most restrictive — no scripts, no forms, no same-origin)
- Export sanitizes HTML before rendering (strips `<script>` tags and event handlers)
- Export uses two-phase approach: iframe for CSS resolution, host div for capture (html2canvas cannot render cross-document elements)
- Zod validates all API inputs (1-500 chars, hex color regex, enum validation)

## Style Presets

10 themes randomly selected per request (or user-customized): `midnight-scholar`, `warm-notebook`, `forest-green`, `sunset-coral`, `ocean-deep`, `lavender-dream`, `charcoal-minimal`, `terracotta`, `arctic-frost`, `golden-hour`. Each has colors (bg/text/accent/surface), Google Fonts pairing, and mood descriptor. Presets array exported for UI consumption.

## Canvas Capabilities

The LLM-generated HTML supports:
- CSS `@keyframes` animations (fade-ins, staggered entrances, pulses)
- SVG diagrams (flowcharts, process diagrams, icons) with SMIL animations
- AI-generated images embedded as base64 data URIs in `<img>` tags
- Math formulas via Unicode symbols, `<sup>`/`<sub>`, CSS fractions
- Responsive layout (400-1400px), max content width 1200px

## Timeout Budget

| Stage | Short | Balanced | Detailed |
|-------|-------|----------|----------|
| Thinker | Skipped | 60s | 90s |
| Coder | 60s | 90s | 120s |
| Image Gen | Skipped | 60s | 60s |
| maxDuration | 240s | 240s | 240s |
