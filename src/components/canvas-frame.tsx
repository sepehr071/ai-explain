"use client";

interface CanvasFrameProps {
  html: string;
}

export default function CanvasFrame({ html }: CanvasFrameProps) {
  console.log("[CanvasFrame] HTML length:", html.length);
  console.log("[CanvasFrame] SVG count:", (html.match(/<svg/gi) || []).length);
  console.log("[CanvasFrame] First 500 chars:", html.slice(0, 500));

  if (!html) return null;

  return (
    <div className="animate-fadeIn w-full">
      <iframe
        srcDoc={html}
        sandbox=""
        title="AI Explanation"
        className="w-full rounded-2xl border border-[#334155] bg-[#0F172A] min-h-[90vh]"
      />
    </div>
  );
}
