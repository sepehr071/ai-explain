"use client";

import { Zap, Scale, BookOpen } from "lucide-react";
import type { DetailLevel } from "@/types/api";

interface DetailLevelSelectorProps {
  value: DetailLevel;
  onChange: (level: DetailLevel) => void;
}

const levels = [
  { key: "short" as const, label: "Short", Icon: Zap },
  { key: "balanced" as const, label: "Balanced", Icon: Scale },
  { key: "detailed" as const, label: "Detailed", Icon: BookOpen },
];

export default function DetailLevelSelector({
  value,
  onChange,
}: DetailLevelSelectorProps) {
  return (
    <div className="flex items-center gap-2 mt-3">
      {levels.map(({ key, label, Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors duration-150 cursor-pointer ${
            value === key
              ? "bg-[#06B6D4]/15 border-[#06B6D4] text-[#22D3EE]"
              : "border-[#334155] text-[#94A3B8] hover:text-[#E2E8F0] hover:border-[#64748B]"
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}
