"use client";

import { useEffect } from "react";

/** Registers the offline app-shell cache (spec section 15/16). Silently
 * no-ops on browsers without SW support instead of breaking the page. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Offline support just won't be available — the app still works online.
      });
    }
  }, []);

  return null;
}
