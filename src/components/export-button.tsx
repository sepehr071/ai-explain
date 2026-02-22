"use client";

import { useState } from "react";
import { ImageIcon, FileText, Loader2, Check } from "lucide-react";
import { exportCanvas, type ExportFormat } from "@/lib/export";

interface ExportButtonProps {
  html: string;
}

type ButtonState = "idle" | "exporting" | "success" | "error";

export default function ExportButton({ html }: ExportButtonProps) {
  const [pngState, setPngState] = useState<ButtonState>("idle");
  const [pdfState, setPdfState] = useState<ButtonState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isExporting = pngState === "exporting" || pdfState === "exporting";

  async function handleExport(format: ExportFormat) {
    const setState = format === "png" ? setPngState : setPdfState;
    setState("exporting");
    setErrorMsg(null);

    try {
      await exportCanvas({ html, format });
      setState("success");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("error");
      setErrorMsg("Export failed");
      setTimeout(() => {
        setState("idle");
        setErrorMsg(null);
      }, 3000);
    }
  }

  function renderButtonContent(
    format: ExportFormat,
    state: ButtonState
  ) {
    if (state === "exporting") {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Exporting...</span>
        </>
      );
    }
    if (state === "success") {
      return (
        <>
          <Check className="w-4 h-4 text-[#4ADE80]" />
          <span className="text-[#4ADE80]">{format.toUpperCase()}</span>
        </>
      );
    }
    if (format === "png") {
      return (
        <>
          <ImageIcon className="w-4 h-4" />
          <span>PNG</span>
        </>
      );
    }
    return (
      <>
        <FileText className="w-4 h-4" />
        <span>PDF</span>
      </>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={isExporting}
        onClick={() => handleExport("png")}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#334155] bg-[#1E293B] text-[#E2E8F0] text-sm hover:bg-[#334155] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer [&_svg]:text-[#94A3B8]"
      >
        {renderButtonContent("png", pngState)}
      </button>
      <button
        type="button"
        disabled={isExporting}
        onClick={() => handleExport("pdf")}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#334155] bg-[#1E293B] text-[#E2E8F0] text-sm hover:bg-[#334155] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer [&_svg]:text-[#94A3B8]"
      >
        {renderButtonContent("pdf", pdfState)}
      </button>
      {errorMsg && (
        <span className="text-[#FCA5A5] text-xs">{errorMsg}</span>
      )}
    </div>
  );
}
