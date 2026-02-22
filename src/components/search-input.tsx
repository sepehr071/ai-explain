"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

interface SearchInputProps {
  onSubmit: (question: string) => void;
  isLoading: boolean;
}

export default function SearchInput({ onSubmit, isLoading }: SearchInputProps) {
  const [value, setValue] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3 w-full">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ask me anything..."
        disabled={isLoading}
        className="bg-[#1E293B] border border-[#334155] rounded-xl px-5 py-3 w-full text-[#E2E8F0] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-transparent transition-colors duration-150 min-h-[44px] disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={isLoading || !value.trim()}
        className="bg-[#06B6D4] text-[#0B0F1A] rounded-full p-3 hover:bg-[#22D3EE] transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <ArrowRight className="w-5 h-5" />
        )}
      </button>
    </form>
  );
}
