import type { CustomStyle, DetailLevel } from "@/types/api";

export interface HistoryEntry {
  id: string;
  question: string;
  html: string;
  previewText: string;
  presetName: string;
  customStyle?: CustomStyle;
  detailLevel?: DetailLevel;
  timestamp: number;
  htmlSize: number;
}

const STORAGE_KEY = "ai-explain-history";
const MAX_STORAGE_BYTES = 4_500_000;

export function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const entries: HistoryEntry[] = JSON.parse(raw);
    return entries.sort((a, b) => b.timestamp - a.timestamp);
  } catch {
    return [];
  }
}

export function addEntry(
  entry: Omit<HistoryEntry, "id" | "htmlSize">
): HistoryEntry {
  const full: HistoryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    htmlSize: entry.html.length,
  };

  try {
    const entries = getHistory();
    entries.unshift(full);
    const trimmed = enforceStorageBudget(entries);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Private browsing or quota exceeded — silently fail
  }

  return full;
}

export function deleteEntry(id: string): void {
  try {
    const entries = getHistory().filter((e) => e.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Silently fail
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently fail
  }
}

export function getStorageUsage(): {
  used: number;
  total: number;
  entryCount: number;
} {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const used = raw ? raw.length : 0;
    const entries: HistoryEntry[] = raw ? JSON.parse(raw) : [];
    return { used, total: MAX_STORAGE_BYTES, entryCount: entries.length };
  } catch {
    return { used: 0, total: MAX_STORAGE_BYTES, entryCount: 0 };
  }
}

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return rtf.format(-diffSeconds, "second");
  }
  if (diffMinutes < 60) {
    return rtf.format(-diffMinutes, "minute");
  }
  if (diffHours < 24) {
    return rtf.format(-diffHours, "hour");
  }
  if (diffDays < 30) {
    return rtf.format(-diffDays, "day");
  }

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return rtf.format(-diffMonths, "month");
  }

  const diffYears = Math.floor(diffDays / 365);
  return rtf.format(-diffYears, "year");
}

export function enforceStorageBudget(
  entries: HistoryEntry[]
): HistoryEntry[] {
  const result = [...entries];
  let serialized = JSON.stringify(result);

  while (serialized.length > MAX_STORAGE_BYTES && result.length > 0) {
    result.pop();
    serialized = JSON.stringify(result);
  }

  return result;
}
