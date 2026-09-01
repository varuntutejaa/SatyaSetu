"use client";

import { Loader2, Wifi, WifiOff } from "lucide-react";

export function ConnectivityIndicator({
  connectivity,
  t,
  pendingCount,
  isSyncing,
}: {
  connectivity: "online" | "weak" | "offline";
  t: (key: string, vars?: Record<string, string | number>) => string;
  pendingCount: number;
  isSyncing: boolean;
}) {
  const Icon = connectivity === "offline" ? WifiOff : Wifi;
  const dotClass = connectivity === "online" ? "conn-dot-online" : connectivity === "weak" ? "conn-dot-weak" : "conn-dot-offline";
  return (
    <div className="connectivity-indicator" title={t(`connectivity.${connectivity}`)}>
      <span className={`conn-dot ${dotClass}`} />
      <Icon size={13} />
      <span className="hidden sm:inline">{t(`connectivity.${connectivity}`)}</span>
      {pendingCount > 0 ? (
        <span className="conn-pending">{isSyncing ? <Loader2 className="animate-spin" size={11} /> : pendingCount}</span>
      ) : null}
    </div>
  );
}
