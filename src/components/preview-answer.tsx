"use client";

interface PreviewAnswerProps {
  text: string | null;
  isLoading: boolean;
  isCanvasReady: boolean;
}

export default function PreviewAnswer({ text, isLoading, isCanvasReady }: PreviewAnswerProps) {
  if (!text && !isLoading) return null;

  return (
    <div
      className={`w-full rounded-2xl border border-line bg-panel/80 p-5 sm:p-6 mb-4 transition-opacity duration-500 ${
        isCanvasReady ? "opacity-40" : "opacity-100"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1.5 h-1.5 rounded-full bg-accent" />
        <span className="text-[13px] font-medium text-muted">
          Quick answer
        </span>
      </div>
      {isLoading ? (
        <div className="space-y-2 motion-safe:animate-pulse">
          <div className="h-4 w-full rounded bg-raised" />
          <div className="h-4 w-4/5 rounded bg-raised" />
        </div>
      ) : (
        <p dir="auto" className="max-w-[75ch] text-fg/90 text-[15px] leading-relaxed">{text}</p>
      )}
    </div>
  );
}
