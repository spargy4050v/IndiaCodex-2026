"use client";

import { useEffect } from "react";
import { useShokoStore } from "@/store/useShokoStore";

/**
 * Bootstraps the global store and keeps it fresh via polling.
 * Mount once near the app root.
 */
export function useShokoData(pollMs = 8000) {
  const init = useShokoStore((s) => s.init);
  const refresh = useShokoStore((s) => s.refresh);

  useEffect(() => {
    init();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, pollMs);
    return () => clearInterval(id);
  }, [init, refresh, pollMs]);
}
