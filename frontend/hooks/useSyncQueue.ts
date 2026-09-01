"use client";

import { useCallback, useEffect, useState } from "react";
import { db, queueForSync, cacheVerification } from "@/lib/db";
import { syncPending } from "@/services/api";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { verifyClaim as verifyClaimRequest } from "@/services/api";

/**
 * Offline verification queue (spec section 18): claims entered while
 * offline are saved locally with an idempotency key and drained through
 * /api/sync — with exponential backoff — the moment connectivity returns.
 * Never re-submits a claim that already made it to SYNCED.
 */
export function useSyncQueue() {
  const connectivity = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const refreshCount = useCallback(async () => {
    const count = await db.pendingVerifications.where("status").anyOf("PENDING", "FAILED").count();
    setPendingCount(count);
  }, []);

  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  const enqueue = useCallback(
    async (claimText: string, language: string) => {
      await queueForSync(claimText, language);
      await refreshCount();
    },
    [refreshCount],
  );

  const drain = useCallback(async () => {
    if (isSyncing) return;
    const items = await db.pendingVerifications.where("status").anyOf("PENDING", "FAILED").toArray();
    if (items.length === 0) return;

    setIsSyncing(true);
    try {
      for (const item of items) {
        if (item.retryCount > 0) {
          const backoffMs = Math.min(2 ** item.retryCount * 1000, 30000);
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }
        await db.pendingVerifications.update(item.id!, { status: "SYNCING" });
        try {
          const result = await verifyClaimRequest(item.claimText, item.language);
          await cacheVerification(item.claimText, item.language, result);
          await db.pendingVerifications.update(item.id!, { status: "SYNCED" });
        } catch {
          await db.pendingVerifications.update(item.id!, {
            status: "FAILED",
            retryCount: item.retryCount + 1,
          });
        }
      }
      setLastSyncedAt(new Date().toISOString());
    } finally {
      setIsSyncing(false);
      await refreshCount();
    }
  }, [isSyncing, refreshCount]);

  useEffect(() => {
    if (connectivity === "online") {
      drain();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectivity]);

  return { pendingCount, isSyncing, lastSyncedAt, enqueue, drain };
}

// Backend-batched variant, kept available for a single manual "Sync now" action.
export async function syncAllPendingViaBatchEndpoint() {
  const items = await db.pendingVerifications.where("status").anyOf("PENDING", "FAILED").toArray();
  if (items.length === 0) return;
  const response = await syncPending(
    items.map((item) => ({
      idempotency_key: item.idempotencyKey,
      claim_text: item.claimText,
      language: item.language,
    })),
  );
  for (const result of response.results) {
    const match = items.find((item) => item.idempotencyKey === result.idempotency_key);
    if (!match?.id) continue;
    await db.pendingVerifications.update(match.id, {
      status: result.status === "SYNCED" ? "SYNCED" : "FAILED",
    });
  }
}
