"use client";

import { useEffect, useRef } from "react";

export interface CanvasMessage {
  type: "ae-section" | "ae-image";
  [key: string]: unknown;
}

interface CanvasFrameProps {
  html: string | null;
  /** The originating question — used for the iframe's accessible title. */
  question?: string | null;
  /** Append-only stream of postMessages to deliver to the canvas (progressive mode). */
  messages?: CanvasMessage[];
}

/**
 * Sandboxed canvas iframe. In static mode it renders `html`. In streaming mode
 * the host streams a shell document, then appends `messages` (sections + images)
 * which are postMessaged into the canvas once it signals readiness.
 *
 * The iframe is a fixed-height scrolling viewport (not content-sized): that lets
 * the canvas's own viewport units, position:fixed overlays (lightbox), and
 * scroll-triggered reveals behave exactly as a normal page — none of which work
 * in a content-sized iframe whose viewport tracks its own height.
 */
export default function CanvasFrame({ html, question, messages = [] }: CanvasFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const readyRef = useRef(false);
  const postedRef = useRef(0);

  function flush() {
    const win = iframeRef.current?.contentWindow;
    if (!readyRef.current || !win) return;
    for (let i = postedRef.current; i < messages.length; i++) {
      try { win.postMessage(messages[i], "*"); } catch { /* iframe gone */ }
    }
    postedRef.current = messages.length;
  }

  // New document → iframe reloads; reset readiness and post cursor.
  useEffect(() => {
    readyRef.current = false;
    postedRef.current = 0;
  }, [html]);

  // After every render attempt to deliver any newly-appended messages.
  useEffect(() => { flush(); });

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (iframeRef.current && e.source !== iframeRef.current.contentWindow) return;
      const d = e.data as { type?: string } | null;
      if (d?.type === "ae-ready") {
        readyRef.current = true;
        flush();
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!html) return null;

  return (
    <div className="animate-fadeIn w-full">
      <iframe
        ref={iframeRef}
        srcDoc={html}
        sandbox="allow-scripts"
        title={question ? `Visual explanation of: ${question}` : "AI visual explanation"}
        className="w-full rounded-2xl border border-line bg-ink min-h-[90vh] shadow-[0_30px_80px_-30px_rgb(0_0_0/0.7)]"
      />
    </div>
  );
}
