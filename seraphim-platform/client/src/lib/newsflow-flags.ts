/**
 * Local persistence for NewsFlow flagged / queued articles (keyed by URL).
 */

export const NEWSFLOW_FLAGS_STORAGE_KEY = "seraphim.newsflow.flags";

/** Dispatched on the window when flags change in the same tab (storage event is cross-tab only). */
export const NEWSFLOW_FLAGS_CHANGED_EVENT = "seraphim-newsflow-flags-changed";

export type NewsflowArticleFlags = {
  bookmarked: boolean;
  readLater: boolean;
};

export type NewsflowFlagsRecord = Record<string, NewsflowArticleFlags>;

export function loadNewsflowFlags(): NewsflowFlagsRecord {
  try {
    const raw = localStorage.getItem(NEWSFLOW_FLAGS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as NewsflowFlagsRecord;
  } catch {
    return {};
  }
}

export function saveNewsflowFlags(flags: NewsflowFlagsRecord): void {
  try {
    localStorage.setItem(NEWSFLOW_FLAGS_STORAGE_KEY, JSON.stringify(flags));
  } catch {
    /* ignore */
  }
}

export function countNewsflowFlags(flags: NewsflowFlagsRecord): {
  flagged: number;
  queued: number;
} {
  let flagged = 0;
  let queued = 0;
  for (const row of Object.values(flags)) {
    if (row.bookmarked) flagged += 1;
    if (row.readLater) queued += 1;
  }
  return { flagged, queued };
}

/** Call after mutating flags so sidebars and the command palette update in the same tab. */
export function notifyNewsflowFlagsChanged(): void {
  window.dispatchEvent(new CustomEvent(NEWSFLOW_FLAGS_CHANGED_EVENT));
}
