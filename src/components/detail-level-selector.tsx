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
    <div role="radiogroup" aria-label="Detail level" className="inline-flex items-center gap-1 rounded-xl border border-line bg-panel/70 p-1">
      {levels.map(({ key, label, Icon }) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={value === key}
          onClick={() => onChange(key)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors duration-150 cursor-pointer ${
            value === key
              ? "bg-raised text-fg shadow-[0_1px_0_rgb(255_255_255/0.06)_inset] [&_svg]:text-accent"
              : "text-muted hover:text-fg"
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}
