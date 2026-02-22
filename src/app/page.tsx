"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import SearchInput from "@/components/search-input";
import CanvasFrame from "@/components/canvas-frame";
import LoadingAnimation from "@/components/loading-animation";
import PreviewAnswer from "@/components/preview-answer";
import StyleCustomizer from "@/components/style-customizer";
import HistoryGallery from "@/components/history-gallery";
import ExportButton from "@/components/export-button";
import { addEntry, type HistoryEntry } from "@/lib/history";
import DetailLevelSelector from "@/components/detail-level-selector";
import type { CustomStyle, DetailLevel } from "@/types/api";

export default function Home() {
  const [html, setHtml] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Style Customizer
  const [customStyle, setCustomStyle] = useState<CustomStyle | null>(null);
  const [isStyleOpen, setIsStyleOpen] = useState(false);

  // Detail Level
  const [detailLevel, setDetailLevel] = useState<DetailLevel>("balanced");

  // History
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const hasResult = html !== null || isLoading || error !== null;

  async function handleSubmit(q: string) {
    setIsLoading(true);
    setIsPreviewLoading(true);
    setError(null);
    setHtml(null);
    setPreviewText(null);

    let resolvedPreview: string | null = null;
    let resolvedHtml: string | null = null;
    let resolvedPreset: string | null = null;

    // Fire both requests in parallel
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
      .catch(() => {})
      .finally(() => setIsPreviewLoading(false));

    const explainPromise = fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: q,
        detailLevel,
        ...(customStyle ? { customStyle } : {}),
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setError(data?.error ?? `Request failed (${res.status})`);
          return;
        }
        const data = await res.json();
        resolvedHtml = data.html;
        resolvedPreset = data.preset;
        setHtml(data.html);
      })
      .catch(() => {
        setError("Failed to connect. Please try again.");
      })
      .finally(() => setIsLoading(false));

    await Promise.allSettled([previewPromise, explainPromise]);

    // Save to history after both promises settle
    if (resolvedHtml) {
      addEntry({
        question: q,
        html: resolvedHtml,
        previewText: resolvedPreview ?? "",
        presetName: resolvedPreset ?? "unknown",
        customStyle: customStyle ?? undefined,
        detailLevel,
        timestamp: Date.now(),
      });
    }
  }

  function handleSelectHistoryEntry(entry: HistoryEntry) {
    setHtml(entry.html);
    setPreviewText(entry.previewText || null);
    setError(null);
    setIsLoading(false);
    setIsPreviewLoading(false);
    setIsGalleryOpen(false);
  }

  return (
    <main className="flex flex-col items-center w-full min-h-screen">
      <div
        className={`flex flex-col items-center w-full max-w-2xl px-4 transition-all duration-500 ease-out ${
          hasResult ? "pt-6" : "flex-1 justify-center"
        }`}
      >
        {!hasResult && (
          <div className="animate-fadeIn mb-8 text-center">
            <h1 className="text-4xl font-bold text-[#67E8F9]">AI Explain</h1>
            <p className="mt-3 text-lg text-[#A5F3FC]/70 font-light">
              Ask any question, get a beautiful visual explanation
            </p>
          </div>
        )}

        <div className="w-full">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SearchInput onSubmit={handleSubmit} isLoading={isLoading} />
            </div>
            <button
              type="button"
              onClick={() => setIsGalleryOpen(true)}
              className="shrink-0 p-2.5 rounded-xl border border-[#334155] bg-[#1E293B] text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#334155] transition-colors duration-150 cursor-pointer"
              title="History"
            >
              <Clock className="w-5 h-5" />
            </button>
          </div>

          <DetailLevelSelector value={detailLevel} onChange={setDetailLevel} />

          <StyleCustomizer
            customStyle={customStyle}
            onStyleChange={setCustomStyle}
            isOpen={isStyleOpen}
            onToggle={() => setIsStyleOpen((o) => !o)}
          />

          {error && (
            <p className="text-[#FCA5A5] text-sm mt-2">{error}</p>
          )}
        </div>
      </div>

      {hasResult && (
        <div className="w-full max-w-[90rem] px-4 py-6 flex-1">
          <PreviewAnswer
            text={previewText}
            isLoading={isPreviewLoading}
            isCanvasReady={html !== null}
          />
          {isLoading && <LoadingAnimation />}
          {html && (
            <>
              <div className="flex justify-end mb-3">
                <ExportButton html={html} />
              </div>
              <CanvasFrame html={html} />
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
