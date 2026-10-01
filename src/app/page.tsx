"use client";

import { useState } from "react";
import { Clock, RotateCcw } from "lucide-react";
import SearchInput from "@/components/search-input";
import CanvasFrame, { type CanvasMessage } from "@/components/canvas-frame";
import StreamProgress, { type StreamProgressState } from "@/components/stream-progress";
import PreviewAnswer from "@/components/preview-answer";
import StyleCustomizer, { StyleToggle } from "@/components/style-customizer";
import HistoryGallery from "@/components/history-gallery";
import ExportButton from "@/components/export-button";
import { addEntry, type HistoryEntry } from "@/lib/history";
import DetailLevelSelector from "@/components/detail-level-selector";
import type { CustomStyle, DetailLevel, Vocabulary } from "@/types/api";

const EXAMPLES = [
  "How do black holes form?",
  "Why is the sky blue?",
  "How does a transformer neural network work?",
  "What caused the fall of Rome?",
  "فتوسنتز چگونه کار می\u200cکند؟",
];

const EMPTY_PROGRESS: StreamProgressState = { stage: null, titles: [], sectionsDone: 0 };

export default function Home() {
  // canvasHtml = what the iframe renders (streaming shell, or a final/static doc).
  // finalHtml  = the canonical assembled document, used for export + history.
  const [canvasHtml, setCanvasHtml] = useState<string | null>(null);
  const [finalHtml, setFinalHtml] = useState<string | null>(null);
  const [canvasMsgs, setCanvasMsgs] = useState<CanvasMessage[]>([]);
  const [progress, setProgress] = useState<StreamProgressState | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const [customStyle, setCustomStyle] = useState<CustomStyle | null>(null);
  const [isStyleOpen, setIsStyleOpen] = useState(false);
  const [detailLevel, setDetailLevel] = useState<DetailLevel>("balanced");
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const [lastQuestion, setLastQuestion] = useState("");

  const hasResult = canvasHtml !== null || isLoading || error !== null;

  async function runExplain(q: string) {
    const known = new Map<string, string>();
    let finalDoc: string | null = null;
    let presetName = "unknown";
    let vocab: Vocabulary | null = null;

    const res = await fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q, detailLevel, ...(customStyle ? { customStyle } : {}) }),
    });

    if (!res.ok || !res.body) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? `Request failed (${res.status})`);
      return null;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let nl: number;
      while ((nl = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line) continue;

        let ev: Record<string, unknown>;
        try { ev = JSON.parse(line); } catch { continue; }

        switch (ev.t) {
          case "status":
            setProgress((p) => ({ ...(p ?? EMPTY_PROGRESS), stage: ev.stage as StreamProgressState["stage"] }));
            break;
          case "vocab":
            vocab = (ev.vocab as Vocabulary) ?? vocab;
            presetName = (ev.preset as string) ?? presetName;
            setProgress((p) => ({ ...(p ?? EMPTY_PROGRESS), stage: "planning" }));
            break;
          case "plan":
            setProgress({ stage: "planning", titles: (ev.titles as string[]) ?? [], sectionsDone: 0 });
            break;
          case "shell":
            setCanvasMsgs([]);
            setCanvasHtml(ev.html as string);
            break;
          case "section":
            setCanvasMsgs((prev) => [
              ...prev,
              { type: "ae-section", html: ev.html as string },
              ...[...known].map(([id, url]) => ({ type: "ae-image" as const, id, url })),
            ]);
            setProgress((p) => ({
              stage: "designing",
              titles: p?.titles ?? [],
              sectionsDone: (p?.sectionsDone ?? 0) + 1,
            }));
            break;
          case "image":
            known.set(ev.id as string, ev.url as string);
            setCanvasMsgs((prev) => [...prev, { type: "ae-image", id: ev.id as string, url: ev.url as string }]);
            break;
          case "done":
            finalDoc = ev.html as string;
            presetName = (ev.preset as string) ?? presetName;
            vocab = (ev.vocab as Vocabulary) ?? vocab;
            // Settle the live canvas to the canonical final document. It has image
            // src baked inline (same as export/history), so images always render —
            // the progressive shell fills images via JS postMessage, which doesn't
            // survive every case. Clear queued messages so they aren't re-posted
            // into the replacement document.
            setCanvasMsgs([]);
            setCanvasHtml(finalDoc);
            break;
          case "error":
            setError((ev.error as string) ?? "Generation failed");
            break;
        }
      }
    }

    if (finalDoc) {
      setFinalHtml(finalDoc);
      return { html: finalDoc, presetName, vocab };
    }
    return null;
  }

  async function handleSubmit(q: string) {
    setLastQuestion(q);
    setIsLoading(true);
    setIsPreviewLoading(true);
    setError(null);
    setCanvasHtml(null);
    setFinalHtml(null);
    setCanvasMsgs([]);
    setPreviewText(null);
    setProgress({ stage: "thinking", titles: [], sectionsDone: 0 });

    let resolvedPreview: string | null = null;

    const previewPromise = fetch("/api/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q }),
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          resolvedPreview = data.text;
          setPreviewText(data.text);
        }
      })
      .catch(() => { /* preview is best-effort; the canvas is the real answer */ })
      .finally(() => setIsPreviewLoading(false));

    const explainPromise = runExplain(q)
      .catch(() => {
        setError("Failed to connect. Please try again.");
        return null;
      })
      .finally(() => {
        setIsLoading(false);
        setProgress(null);
      });

    const [, explainResult] = await Promise.all([previewPromise, explainPromise]);

    if (explainResult) {
      addEntry({
        question: q,
        html: explainResult.html,
        previewText: resolvedPreview ?? "",
        presetName: explainResult.presetName,
        customStyle: customStyle ?? undefined,
        detailLevel,
        vocab: explainResult.vocab ?? undefined,
        timestamp: Date.now(),
      });
    }
  }

  function handleSelectHistoryEntry(entry: HistoryEntry) {
    setLastQuestion(entry.question);
    setCanvasHtml(entry.html);
    setFinalHtml(entry.html);
    setCanvasMsgs([]);
    setPreviewText(entry.previewText || null);
    setProgress(null);
    setError(null);
    setIsLoading(false);
    setIsPreviewLoading(false);
    setIsGalleryOpen(false);
  }

  const showProgress = isLoading && canvasHtml === null && progress !== null;
  const designing = isLoading && canvasHtml !== null && progress?.stage === "designing";

  const historyButton = (
    <button
      type="button"
      onClick={() => setIsGalleryOpen(true)}
      className="shrink-0 inline-flex items-center gap-2 h-11 px-3.5 rounded-xl border border-line bg-panel text-muted hover:text-fg hover:border-faint transition-colors duration-150 cursor-pointer"
      title="History"
      aria-label="Open history gallery"
    >
      <Clock className="w-[18px] h-[18px]" />
      <span className="hidden sm:inline text-sm">History</span>
    </button>
  );

  return (
    <main className="relative flex flex-col items-center w-full min-h-screen">
      {hasResult ? (
        <header className="sticky top-0 z-30 w-full border-b border-line/70 bg-ink/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-[90rem] items-center gap-3 sm:gap-5 px-4 py-3">
            <span className="hidden md:block font-display text-2xl italic tracking-tight text-fg shrink-0">
              AI Explain
            </span>
            <div className="flex-1 min-w-0">
              <SearchInput onSubmit={handleSubmit} isLoading={isLoading} compact />
            </div>
            {historyButton}
          </div>
        </header>
      ) : (
        <div className="absolute top-0 inset-x-0 flex items-center justify-between px-5 sm:px-8 py-5">
          <span className="font-display text-2xl italic tracking-tight text-fg">AI Explain</span>
          {historyButton}
        </div>
      )}

      <div
        className={`flex flex-col items-center w-full px-4 ${
          hasResult ? "max-w-[90rem]" : "max-w-3xl flex-1 justify-center pt-28 pb-16"
        }`}
      >
        {!hasResult && (
          <div className="animate-fadeIn mb-10 text-center">
            <h1 className="font-display text-[2.75rem] sm:text-[4.25rem] leading-[1.02] tracking-[-0.02em] text-fg text-balance">
              Ask a question.
              <br />
              <span className="italic text-muted">Get a page that explains it.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-muted text-pretty">
              A planner and parallel designers turn your question into an interactive visual
              explainer, streamed section by section into a sandboxed canvas.
            </p>
          </div>
        )}

        <div className={hasResult ? "w-full pt-4" : "w-full"}>
          {!hasResult && <SearchInput onSubmit={handleSubmit} isLoading={isLoading} />}

          <div className={`flex flex-wrap items-center justify-between gap-3 ${hasResult ? "" : "mt-4"}`}>
            <DetailLevelSelector value={detailLevel} onChange={setDetailLevel} />
            <StyleToggle isOpen={isStyleOpen} onToggle={() => setIsStyleOpen((o) => !o)} />
          </div>

          <StyleCustomizer
            customStyle={customStyle}
            onStyleChange={setCustomStyle}
            isOpen={isStyleOpen}
          />

          {!hasResult && (
            <div className="mt-10">
              <p className="mb-3 text-center text-sm text-faint">Try one of these</p>
              <div className="flex flex-wrap justify-center gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    dir="auto"
                    onClick={() => handleSubmit(ex)}
                    className="rounded-full border border-line bg-panel/70 px-4 py-2 text-sm text-muted hover:text-fg hover:border-accent/60 transition-colors duration-150 cursor-pointer"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div role="alert" className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[#7F1D1D] bg-[#7F1D1D]/20 px-4 py-3">
              <p className="text-[#FCA5A5] text-sm">{error}</p>
              <button
                type="button"
                onClick={() => handleSubmit(lastQuestion)}
                disabled={isLoading || !lastQuestion}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-[#FCA5A5]/40 px-2.5 py-1 text-sm text-[#FCA5A5] hover:bg-[#FCA5A5]/10 transition-colors duration-150 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          )}
        </div>
      </div>

      {!hasResult && (
        <footer className="pb-8 px-4 text-center text-xs text-faint">
          Each answer is designed in one of three visual languages: editorial, cinematic or museum.
        </footer>
      )}

      {hasResult && (
        <div className="w-full max-w-[90rem] px-4 pt-5 pb-8 flex-1">
          {lastQuestion && (
            <h2 dir="auto" className="mb-4 font-display text-3xl sm:text-4xl tracking-tight text-fg text-balance">
              {lastQuestion}
            </h2>
          )}

          <PreviewAnswer
            text={previewText}
            isLoading={isPreviewLoading}
            isCanvasReady={canvasHtml !== null}
          />

          {showProgress && <StreamProgress {...progress} />}

          {canvasHtml && (
            <>
              <div className="flex items-center justify-end gap-3 mb-3 min-h-[2rem]">
                {designing && (
                  <span className="mr-auto inline-flex items-center gap-2 text-sm text-accent">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent motion-safe:animate-pulse" />
                    Designing {progress?.sectionsDone ?? 0}
                    {progress?.titles?.length ? ` / ${progress.titles.length}` : ""} sections…
                  </span>
                )}
                {finalHtml && !isLoading && <ExportButton html={finalHtml} />}
              </div>
              <CanvasFrame html={canvasHtml} question={lastQuestion} messages={canvasMsgs} />
            </>
          )}
        </div>
      )}

      <HistoryGallery
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onSelectEntry={handleSelectHistoryEntry}
      />
    </main>
  );
}
