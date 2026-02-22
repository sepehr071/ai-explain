# AI Explain

Ask any question, get a beautiful visual explanation. Each answer is rendered as a unique HTML/CSS canvas inside a sandboxed iframe, styled with a randomly selected theme from 10 curated presets.

A fast LLM provides a quick text preview while the full visual canvas generates in the background.

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind CSS 4** (PostCSS plugin)
- **OpenRouter API** (two models: main for HTML canvas, fast for text preview)
- **Zod v4** for input validation
- **lucide-react** for icons

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your OpenRouter API key and model choices

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | Your OpenRouter API key |
| `OPENROUTER_MODEL` | Model for HTML canvas generation (e.g. `google/gemini-3-flash-preview`) |
| `OPENROUTER_FAST_MODEL` | Fast model for text preview (e.g. `x-ai/grok-4.1-fast`) |

## Project Structure

```
src/
  app/
    layout.tsx              # Root layout, Inter font, dark background
    page.tsx                # Main page — state management, parallel fetch
    globals.css             # Tailwind v4 import, animations
    api/
      explain/route.ts      # POST — main canvas generation (60s timeout)
      preview/route.ts      # POST — fast text preview (15s timeout)
  components/
    search-input.tsx        # Question input with Lucide icons
    canvas-frame.tsx        # Sandboxed iframe renderer
    loading-animation.tsx   # Skeleton shimmer
    preview-answer.tsx      # Quick text answer card
  lib/
    openrouter.ts           # OpenRouter API wrapper (configurable model/temp/tokens)
    prompts.ts              # Thinker + coder prompt builders
    styles.ts               # 10 style presets + random selection
  types/
    api.ts                  # Shared interfaces
```

## How It Works

1. User submits a question
2. Two parallel API requests fire:
   - `/api/preview` — fast model returns plain text (shown immediately)
   - `/api/explain` — two-stage pipeline:
     - **Thinker** (fast model) — produces a structured content plan: sections, key points, diagram descriptions, data
     - **Coder** (main model) — renders the content plan as a styled HTML/CSS/SVG infographic using a random style preset
3. The canvas HTML is rendered in `<iframe srcDoc={html} sandbox="" />`
4. Preview fades to 40% opacity when the canvas arrives

## Style Presets

Each response uses one of 10 randomly selected themes:

`midnight-scholar` · `warm-notebook` · `forest-green` · `sunset-coral` · `ocean-deep` · `lavender-dream` · `charcoal-minimal` · `terracotta` · `arctic-frost` · `golden-hour`

Each theme includes curated colors, a Google Fonts pairing, and a mood descriptor.

## Scripts

```bash
npm run dev      # Dev server
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint
```
