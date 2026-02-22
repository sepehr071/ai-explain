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
      className={`w-full rounded-xl border border-[#334155] bg-[#1E293B] p-5 mb-4 transition-opacity duration-500 ${
        isCanvasReady ? "opacity-40" : "opacity-100"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-[#06B6D4]" />
        <span className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
          Quick Answer
        </span>
      </div>
      {isLoading ? (
        <div className="space-y-2 motion-safe:animate-pulse">
          <div className="h-4 w-full rounded bg-[#283548]" />
          <div className="h-4 w-4/5 rounded bg-[#283548]" />
        </div>
      ) : (
        <p className="text-[#CBD5E1] text-sm leading-relaxed">{text}</p>
      )}
    </div>
  );
}
