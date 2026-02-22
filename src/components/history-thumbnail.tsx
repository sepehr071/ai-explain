"use client";

import { useRef, useEffect, useState } from "react";

interface HistoryThumbnailProps {
  html: string;
}

export default function HistoryThumbnail({ html }: HistoryThumbnailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.25);

  useEffect(() => {
    function updateScale() {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      setScale(containerWidth / 1200);
    }

    updateScale();

    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[180px] overflow-hidden rounded-lg border border-[#334155] bg-[#0F172A]"
    >
      <iframe
        srcDoc={html}
        sandbox=""
        title="Preview"
        tabIndex={-1}
        aria-hidden="true"
        style={{
          width: "1200px",
          height: `${180 / scale}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          pointerEvents: "none",
          position: "absolute",
          top: 0,
          left: 0,
          border: "none",
        }}
      />
    </div>
  );
}
