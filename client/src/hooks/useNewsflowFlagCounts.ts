import {
  NEWSFLOW_FLAGS_CHANGED_EVENT,
  NEWSFLOW_FLAGS_STORAGE_KEY,
  countNewsflowFlags,
  loadNewsflowFlags,
} from "@/lib/newsflow-flags";
import { useEffect, useState } from "react";

export type NewsflowFlagCounts = {
  flagged: number;
  queued: number;
};

/**
 * Live counts of flagged / queued NewsFlow items for sidebar badges and command palette.
 */
export function useNewsflowFlagCounts(): NewsflowFlagCounts {
  const [counts, setCounts] = useState<NewsflowFlagCounts>(() =>
    countNewsflowFlags(loadNewsflowFlags()),
  );

  useEffect(() => {
    const sync = () => {
      setCounts(countNewsflowFlags(loadNewsflowFlags()));
    };

    sync();

    const onStorage = (e: StorageEvent) => {
      if (e.key === NEWSFLOW_FLAGS_STORAGE_KEY || e.key === null) {
        sync();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(NEWSFLOW_FLAGS_CHANGED_EVENT, sync);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(NEWSFLOW_FLAGS_CHANGED_EVENT, sync);
    };
  }, []);

  return counts;
}
