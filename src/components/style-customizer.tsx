"use client";

import { useMemo } from "react";
import { Palette, Sun, Moon, RotateCcw } from "lucide-react";
import type { CustomStyle } from "@/types/api";
import { getAllFontPairings } from "@/lib/styles";
import { deriveColors } from "@/lib/style-utils";

interface StyleCustomizerProps {
  customStyle: CustomStyle | null;
  onStyleChange: (style: CustomStyle | null) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const DEFAULT_ACCENT = "#06B6D4";
const DEFAULT_MODE: "light" | "dark" = "dark";

export default function StyleCustomizer({
  customStyle,
  onStyleChange,
  isOpen,
  onToggle,
}: StyleCustomizerProps) {
  const fontPairings = useMemo(() => getAllFontPairings(), []);
  const defaultFontPairing = fontPairings[0]?.presetName ?? "midnight-scholar";

  const currentAccent = customStyle?.accentColor ?? DEFAULT_ACCENT;
  const currentMode = customStyle?.mode ?? DEFAULT_MODE;
  const currentFont = customStyle?.fontPairing ?? defaultFontPairing;

  const previewColors = useMemo(
    () => deriveColors(currentAccent, currentMode),
    [currentAccent, currentMode],
  );

  function emitChange(patch: Partial<CustomStyle>) {
    onStyleChange({
      accentColor: customStyle?.accentColor ?? DEFAULT_ACCENT,
      fontPairing: customStyle?.fontPairing ?? defaultFontPairing,
      mode: customStyle?.mode ?? DEFAULT_MODE,
      ...patch,
    });
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1E293B] transition-colors duration-150 cursor-pointer"
      >
        <Palette className="w-4 h-4" />
        <span>Customize Style</span>
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-3 rounded-xl border border-[#334155] bg-[#1E293B] p-5 space-y-5">
            {/* Color picker */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
                Accent Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={currentAccent}
                  onChange={(e) => emitChange({ accentColor: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-[#334155] bg-transparent cursor-pointer [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none [&::-moz-color-swatch]:rounded-md [&::-moz-color-swatch]:border-none"
                />
                <span className="text-sm text-[#CBD5E1] font-mono">
                  {currentAccent.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Font dropdown */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
                Font Pairing
              </label>
              <select
                value={currentFont}
                onChange={(e) => emitChange({ fontPairing: e.target.value })}
                className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-transparent transition-colors duration-150 cursor-pointer"
              >
                {fontPairings.map((fp) => (
                  <option key={fp.presetName} value={fp.presetName}>
                    {fp.heading} / {fp.body}
                  </option>
                ))}
              </select>
            </div>

            {/* Light/Dark toggle */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
                Mode
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => emitChange({ mode: "dark" })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer ${
                    currentMode === "dark"
                      ? "bg-[#334155] text-[#E2E8F0]"
                      : "bg-transparent text-[#64748B] hover:text-[#94A3B8]"
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  Dark
                </button>
                <button
                  type="button"
                  onClick={() => emitChange({ mode: "light" })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer ${
                    currentMode === "light"
                      ? "bg-[#334155] text-[#E2E8F0]"
                      : "bg-transparent text-[#64748B] hover:text-[#94A3B8]"
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  Light
                </button>
              </div>
            </div>

            {/* Live preview swatch */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
                Preview
              </label>
              <div className="flex items-center gap-3">
                {(
                  [
                    { color: previewColors.bg, label: "BG" },
                    { color: previewColors.surface, label: "Surface" },
                    { color: previewColors.accent, label: "Accent" },
                    { color: previewColors.text, label: "Text" },
                  ] as const
                ).map(({ color, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1">
                    <div
                      className="w-8 h-8 rounded-md border border-[#334155]"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[10px] text-[#64748B]">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reset button */}
            <button
              type="button"
              onClick={() => onStyleChange(null)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#0F172A] transition-colors duration-150 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Random</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
