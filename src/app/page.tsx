"use client";

import { useState } from "react";
import SearchInput from "@/components/search-input";
import CanvasFrame from "@/components/canvas-frame";
import LoadingAnimation from "@/components/loading-animation";
import PreviewAnswer from "@/components/preview-answer";

export default function Home() {
  const [html, setHtml] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const hasResult = html !== null || isLoading || error !== null;

  async function handleSubmit(q: string) {
    setIsLoading(true);
    setIsPreviewLoading(true);
    setError(null);
    setHtml(null);
    setPreviewText(null);

    // Fire both requests in parallel
    const previewPromise = fetch("/api/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q }),
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setPreviewText(data.text);
        }
      })
      .catch(() => {})
      .finally(() => setIsPreviewLoading(false));

    const explainPromise = fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setError(data?.error ?? `Request failed (${res.status})`);
          return;
        }
        const data = await res.json();
        setHtml(data.html);
      })
      .catch(() => {
        setError("Failed to connect. Please try again.");
      })
      .finally(() => setIsLoading(false));

    await Promise.allSettled([previewPromise, explainPromise]);
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
          <SearchInput onSubmit={handleSubmit} isLoading={isLoading} />
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
          {html && <CanvasFrame html={html} />}
        </div>
      )}
    </main>
  );
}
