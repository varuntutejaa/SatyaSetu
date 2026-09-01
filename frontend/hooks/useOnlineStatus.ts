"use client";

import { useEffect, useRef, useState } from "react";

export type ConnectivityState = "online" | "weak" | "offline";

type NetworkInformation = {
  effectiveType?: string;
  saveData?: boolean;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
};

const PROBE_URL = "/manifest.json?_swbypass=1";
const PROBE_TIMEOUT_MS = 4000;
const PROBE_INTERVAL_MS = 20000;

function readEffectiveType(): "weak" | null {
  if (typeof navigator === "undefined") return null;
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (connection?.effectiveType && ["slow-2g", "2g"].includes(connection.effectiveType)) return "weak";
  if (connection?.saveData) return "weak";
  return null;
}

/**
 * navigator.onLine is well documented as unreliable — Chromium in
 * particular can report `true` immediately after a page is served from an
 * offline cache. Since this app's whole premise is "never claim to be live
 * when you're not" (spec section 16), connectivity here is a real network
 * probe (a tiny same-origin fetch, routed around the service worker's
 * cache fallback via _swbypass) rather than a trusted browser flag.
 */
async function probeReachable(): Promise<boolean> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    const response = await fetch(PROBE_URL, { method: "HEAD", cache: "no-store", signal: controller.signal });
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

export function useOnlineStatus(): ConnectivityState {
  const [state, setState] = useState<ConnectivityState>("online");
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    async function refresh() {
      const reachable = await probeReachable();
      if (!mountedRef.current) return;
      setState(reachable ? (readEffectiveType() ?? "online") : "offline");
    }

    refresh();
    const interval = setInterval(refresh, PROBE_INTERVAL_MS);

    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") refresh();
    });
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    connection?.addEventListener?.("change", refresh);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
      connection?.removeEventListener?.("change", refresh);
    };
  }, []);

  return state;
}
