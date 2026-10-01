// Captures the README screenshots into docs/images/ with demo data only (no API key needed).
//
//   npm run dev -- -H 127.0.0.1 -p 4240        (in another terminal)
//   BASE_URL=http://127.0.0.1:4240 node scripts/capture-screenshots.mjs
//
// Requires Playwright (`npm i -D playwright` or NODE_PATH pointing at an install).
// - History is seeded in localStorage with the hand-written reference canvases that ship
//   in src/lib/vocabularies/*.ts (the worked examples given to the coder prompt), not model output.
// - The generation-progress shot fakes /api/explain and /api/preview in the page with synthetic events.
import { createRequire } from "node:module";
import { readFileSync, mkdirSync } from "node:fs";

const { chromium } = createRequire(import.meta.url)("playwright"); // CJS resolution honours NODE_PATH

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:4240";
const OUT = new URL("../docs/images/", import.meta.url);
mkdirSync(OUT, { recursive: true });

function workedExample(vocab) {
  const src = readFileSync(new URL(`../src/lib/vocabularies/${vocab}.ts`, import.meta.url), "utf8");
  return src.match(/workedExample: `([\s\S]*?)`,\r?\n/)[1];
}

const now = Date.now();
const history = [
  { q: "What is the solar system made of?", vocab: "museum", preset: "charcoal-minimal", ago: 4 },
  { q: "What is time, really?", vocab: "editorial", preset: "warm-notebook", ago: 26 },
  { q: "How does quantum computing work?", vocab: "cinematic", preset: "midnight-scholar", ago: 190 },
].map((e, i) => {
  const html = workedExample(e.vocab);
  return {
    id: `demo-${i}`, question: e.q, html, previewText: "", presetName: e.preset,
    vocab: e.vocab, detailLevel: "balanced", timestamp: now - e.ago * 60_000, htmlSize: html.length,
  };
});

// Keeps /api/explain open after a few synthetic events so the progress view stays on screen.
function fakeStream() {
  const events = [
    { t: "status", stage: "thinking" },
    { t: "vocab", vocab: "cinematic", preset: "midnight-scholar" },
    { t: "plan", titles: ["Light that bends around nothing", "The rotation curve problem", "What we can rule out", "Leading candidates", "How detectors hunt for it"] },
    { t: "section", html: "" },
    { t: "section", html: "" },
  ];
  const realFetch = window.fetch;
  window.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input.url;
    if (url.includes("/api/preview")) {
      return new Response(JSON.stringify({ text: "Dark matter is the name for mass we can detect only through gravity: galaxies spin too fast and light bends too much for the visible matter alone. It neither emits nor absorbs light, and its nature is still unknown." }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.includes("/api/explain")) {
      const enc = new TextEncoder();
      const body = new ReadableStream({
        async start(c) {
          for (const ev of events) { c.enqueue(enc.encode(JSON.stringify(ev) + "\n")); await new Promise((r) => setTimeout(r, 150)); }
        },
      });
      return new Response(body, { headers: { "Content-Type": "application/x-ndjson" } });
    }
    return realFetch(input, init);
  };
}

const browser = await chromium.launch();
async function page(viewport, seed = false) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, colorScheme: "dark" });
  if (seed) await ctx.addInitScript((h) => localStorage.setItem("ai-explain-history", JSON.stringify(h)), history);
  const p = await ctx.newPage();
  await p.goto(BASE, { waitUntil: "networkidle" });
  await p.waitForTimeout(800);
  return p;
}
const shot = (p, name) => p.screenshot({ path: new URL(name, OUT).pathname.replace(/^\/([A-Za-z]:)/, "$1") });
const desktop = { width: 1440, height: 900 };

let p = await page(desktop);
await p.getByRole("textbox", { name: "Your question" }).fill("How does a transformer neural network work?");
await p.waitForTimeout(400);
await shot(p, "home.png");

p = await page({ width: 390, height: 844 });
await shot(p, "home-mobile.png");

p = await page(desktop, true);
await p.getByRole("button", { name: "Open history gallery" }).click();
await p.waitForTimeout(3500); // thumbnails load web fonts
await shot(p, "history.png");

await p.getByRole("button", { name: /Open: What is time/ }).click();
await p.waitForTimeout(3000);
await shot(p, "canvas-editorial.png");

p = await page(desktop);
await p.evaluate(fakeStream);
await p.getByRole("textbox", { name: "Your question" }).fill("What is dark matter?");
await p.getByRole("button", { name: "Explain" }).click();
await p.waitForTimeout(1500);
await shot(p, "generating.png");

await browser.close();
console.log("saved to", OUT.pathname);
