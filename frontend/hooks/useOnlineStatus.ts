"use client";

import { useEffect, useState } from "react";

export type ConnectivityState = "online" | "weak" | "offline";

type NetworkInformation = {
  effectiveType?: string;
  saveData?: boolean;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
};

function readConnectivity(): ConnectivityState {
  if (typeof navigator === "undefined") return "online";
  if (!navigator.onLine) return "offline";

  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (connection?.effectiveType && ["slow-2g", "2g"].includes(connection.effectiveType)) return "weak";
  if (connection?.saveData) return "weak";
  return "online";
}

/** Tri-state connectivity per spec section 16: ONLINE / WEAK / OFFLINE. */
export function useOnlineStatus(): ConnectivityState {
  const [state, setState] = useState<ConnectivityState>("online");

  useEffect(() => {
    setState(readConnectivity());
    const update = () => setState(readConnectivity());

    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    connection?.addEventListener?.("change", update);

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      connection?.removeEventListener?.("change", update);
    };
  }, []);

  return state;
}
