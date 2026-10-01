"use client";

import { useEffect, useReducer } from "react";
import { Clock, Trash2, X } from "lucide-react";
import HistoryThumbnail from "@/components/history-thumbnail";
import {
  getHistory,
  deleteEntry,
  clearHistory,
  getStorageUsage,
  formatRelativeTime,
  type HistoryEntry,
} from "@/lib/history";

interface HistoryGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEntry: (entry: HistoryEntry) => void;
}

export default function HistoryGallery({
  isOpen,
  onClose,
  onSelectEntry,
}: HistoryGalleryProps) {
  // Mutation counter — bumping forces a re-render which re-reads localStorage.
  // No effects needed: when !isOpen the component returns null (unmounts),
  // so each open gets a fresh render that reads current data.
  const [, forceUpdate] = useReducer((n: number) => n + 1, 0);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Read data during render — safe because we only reach here when isOpen.
  // Each open re-mounts (returns null when closed), so data is always fresh.
  // After mutations we call forceUpdate() to trigger a re-read.
  const entries = getHistory();
  const storageUsage = getStorageUsage();

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    deleteEntry(id);
    forceUpdate();
  }

  function handleClearAll() {
    if (!window.confirm("Clear all history? This cannot be undone.")) return;
    clearHistory();
    forceUpdate();
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  const usagePercent = Math.min(
    (storageUsage.used / storageUsage.total) * 100,
    100
  );

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-[2px] animate-fadeIn"
      onClick={handleBackdropClick}
    >
      {/* Panel */}
      <div
        className="w-full max-w-4xl h-full bg-ink border-l border-line flex flex-col shadow-2xl animate-slideInRight"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line shrink-0">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-accent" />
            <h2 className="font-display text-2xl tracking-tight text-fg">History</h2>
            {storageUsage.entryCount > 0 && (
              <span className="text-xs font-medium text-muted bg-panel px-2 py-0.5 rounded-full">
                {storageUsage.entryCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Storage usage bar */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-24 h-1.5 bg-panel rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${usagePercent}%`,
                    backgroundColor:
                      usagePercent > 80 ? "#F87171" : "var(--color-accent)",
                  }}
                />
              </div>
              <span className="text-xs text-faint">
                {(storageUsage.used / 1_000_000).toFixed(1)}MB
              </span>
            </div>

            {entries.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1.5 text-xs text-muted hover:text-[#F87171] transition-colors duration-150 cursor-pointer px-2 py-1 rounded hover:bg-panel"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear all
              </button>
            )}

            <button
              onClick={onClose}
              aria-label="Close history"
              className="text-muted hover:text-fg transition-colors duration-150 cursor-pointer p-1 rounded hover:bg-panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Clock className="w-12 h-12 text-line mb-4" />
              <p className="text-muted text-sm">
                No explanations yet. Ask a question and the finished canvas is saved here, in this browser.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => onSelectEntry(entry)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open: ${entry.question}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectEntry(entry);
                    }
                  }}
                  className="group relative bg-panel border border-line rounded-2xl overflow-hidden cursor-pointer hover:border-accent/50 transition-colors duration-200 focus-visible:border-accent"
                >
                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDelete(e, entry.id)}
                    aria-label="Delete this canvas"
                    className="absolute top-2 right-2 z-10 p-1 rounded bg-ink/80 text-muted hover:text-[#F87171] hover:bg-ink opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all duration-150 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  {/* Thumbnail */}
                  <HistoryThumbnail html={entry.html} />

                  {/* Card info */}
                  <div className="p-3">
                    <p dir="auto" className="text-[15px] font-medium text-fg line-clamp-2 leading-snug">
                      {entry.question.length > 80
                        ? entry.question.slice(0, 80) + "..."
                        : entry.question}
                    </p>
                    <div className="flex flex-wrap items-center mt-3 gap-x-2 gap-y-1.5">
                      <span className="text-xs text-faint shrink-0">
                        {formatRelativeTime(entry.timestamp)}
                      </span>
                      <div className="flex items-center gap-1 ml-auto">
                        {entry.vocab && (
                          <span className="text-[11px] font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full capitalize">
                            {entry.vocab}
                          </span>
                        )}
                        <span className="text-[11px] font-medium text-muted bg-ink px-2 py-0.5 rounded-full">
                          {entry.presetName}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
