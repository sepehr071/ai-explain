"use client";

import { useState, type FormEvent } from "react";
import { ArrowUp, Loader2 } from "lucide-react";

interface SearchInputProps {
  onSubmit: (question: string) => void;
  isLoading: boolean;
  /** Smaller variant for the sticky results header. */
  compact?: boolean;
}

export default function SearchInput({ onSubmit, isLoading, compact = false }: SearchInputProps) {
  const [value, setValue] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`group flex items-center gap-2 w-full rounded-2xl border border-line bg-panel/90 shadow-[0_1px_0_rgb(255_255_255/0.04)_inset,0_20px_50px_-20px_rgb(0_0_0/0.6)] focus-within:border-accent/70 focus-within:ring-4 focus-within:ring-accent/10 transition-[border-color,box-shadow] duration-150 ${
        compact ? "p-1 pl-4" : "p-2 pl-5"
      }`}
    >
      <input
        type="text"
        dir="auto"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={compact ? "Ask another question" : "Why do stars twinkle?"}
        aria-label="Your question"
        disabled={isLoading}
        className={`w-full min-w-0 bg-transparent text-fg placeholder:text-faint focus:outline-none focus-visible:outline-none disabled:opacity-50 ${
          compact ? "h-9 text-[15px]" : "h-12 text-lg"
        }`}
      />
      <button
        type="submit"
        aria-label="Explain"
        disabled={isLoading || !value.trim()}
        className={`shrink-0 flex items-center justify-center gap-1.5 rounded-xl bg-accent text-ink font-medium hover:bg-accent-strong transition-colors duration-150 cursor-pointer disabled:bg-raised disabled:text-faint disabled:cursor-not-allowed ${
          compact ? "h-9 w-9" : "h-12 px-5"
        }`}
      >
        {isLoading ? (
          <Loader2 className="w-[18px] h-[18px] animate-spin" />
        ) : (
          <ArrowUp className="w-[18px] h-[18px]" />
        )}
        {!compact && <span className="hidden sm:inline">Explain</span>}
      </button>
    </form>
  );
}
