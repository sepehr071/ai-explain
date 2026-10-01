"use client";

import { Check, Loader2 } from "lucide-react";

export type Stage = "thinking" | "planning" | "designing";

export interface StreamProgressState {
  stage: Stage | null;
  titles: string[];
  sectionsDone: number;
}

const STAGES: Stage[] = ["thinking", "planning", "designing"];
const STAGE_LABEL: Record<Stage, string> = {
  thinking: "Researching the topic",
  planning: "Structuring the sections",
  designing: "Designing the canvas",
};

export default function StreamProgress({ stage, titles, sectionsDone }: StreamProgressState) {
  const activeIdx = stage ? STAGES.indexOf(stage) : 0;

  return (
    <div className="animate-fadeIn rounded-2xl border border-line bg-panel/60 p-6 sm:p-10 w-full min-h-[40vh]">
      <div className="flex flex-col gap-3.5">
        {STAGES.map((s, i) => {
          const done = i < activeIdx;
          const active = i === activeIdx;
          return (
            <div key={s} className="flex items-center gap-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  done
                    ? "border-accent bg-accent/15 text-accent"
                    : active
                      ? "border-accent text-accent"
                      : "border-line text-faint"
                }`}
              >
                {done ? (
                  <Check className="h-4 w-4" />
                ) : active ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                )}
              </span>
              <span
                className={`text-sm ${
                  active ? "text-fg font-medium" : done ? "text-muted" : "text-faint"
                }`}
              >
                {STAGE_LABEL[s]}
              </span>
            </div>
          );
        })}
      </div>

      {titles.length > 0 && (
        <div className="mt-6 border-t border-line pt-4">
          <p className="mb-3 text-[13px] text-faint">
            {sectionsDone} of {titles.length} sections designed
          </p>
          <ul className="space-y-2">
            {titles.map((t, i) => {
              const ready = i < sectionsDone;
              return (
                <li
                  key={i}
                  className={`flex items-center gap-2 text-sm transition-colors ${
                    ready ? "text-fg" : "text-faint"
                  }`}
                >
                  {ready ? (
                    <Check className="h-3.5 w-3.5 shrink-0 text-accent" />
                  ) : (
                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin opacity-40" />
                  )}
                  <span dir="auto" className="truncate">{t}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
