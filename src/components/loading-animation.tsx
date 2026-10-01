"use client";

export default function LoadingAnimation() {
  return (
    <div className="rounded-2xl border border-line bg-panel p-8 min-h-[90vh] w-full">
      {/* Header bar */}
      <div className="motion-safe:animate-pulse">
        <div className="h-8 w-2/3 rounded bg-line" />
      </div>

      {/* Spacer */}
      <div className="mt-6" />

      {/* Body text lines */}
      <div className="motion-safe:animate-pulse space-y-3">
        <div className="h-4 w-full rounded bg-raised" />
        <div className="h-4 w-5/6 rounded bg-raised" />
        <div className="h-4 w-4/5 rounded bg-raised" />
      </div>

      {/* Spacer */}
      <div className="mt-8" />

      {/* Side-by-side card placeholders */}
      <div className="motion-safe:animate-pulse flex gap-4">
        <div className="h-32 w-1/2 rounded-lg bg-raised" />
        <div className="h-32 w-1/2 rounded-lg bg-raised" />
      </div>

      {/* Spacer */}
      <div className="mt-8" />

      {/* More body lines */}
      <div className="motion-safe:animate-pulse space-y-3">
        <div className="h-4 w-full rounded bg-raised" />
        <div className="h-4 w-3/4 rounded bg-raised" />
        <div className="h-4 w-5/6 rounded bg-raised" />
      </div>
    </div>
  );
}
