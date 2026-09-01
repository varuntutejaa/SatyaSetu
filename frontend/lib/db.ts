import Dexie, { type Table } from "dexie";
import type { SourceOut, VerifyResponse } from "@/services/api";

export type CachedVerification = {
  claimHash: string;
  claimText: string;
  language: string;
  result: VerifyResponse;
  cachedAt: string;
};

export type PendingVerification = {
  id?: number;
  idempotencyKey: string;
  claimText: string;
  language: string;
  createdAt: string;
  status: "PENDING" | "SYNCING" | "SYNCED" | "FAILED";
  retryCount: number;
};

export type Setting = { key: string; value: unknown };

class SatyaSetuDB extends Dexie {
  cachedVerifications!: Table<CachedVerification, string>;
  pendingVerifications!: Table<PendingVerification, number>;
  cachedSources!: Table<SourceOut, string>;
  settings!: Table<Setting, string>;

  constructor() {
    super("satyasetu");
    this.version(1).stores({
      cachedVerifications: "claimHash, cachedAt",
      pendingVerifications: "++id, idempotencyKey, status, createdAt",
      cachedSources: "id",
      settings: "key",
    });
  }
}

export const db = new SatyaSetuDB();

/** djb2 — enough to key a local cache, not a security hash. */
export function hashClaim(text: string): string {
  let hash = 5381;
  const normalized = text.trim().toLowerCase();
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 33) ^ normalized.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

export async function cacheVerification(claimText: string, language: string, result: VerifyResponse) {
  await db.cachedVerifications.put({
    claimHash: hashClaim(claimText),
    claimText,
    language,
    result,
    cachedAt: new Date().toISOString(),
  });
}

export async function getCachedVerification(claimText: string): Promise<CachedVerification | undefined> {
  return db.cachedVerifications.get(hashClaim(claimText));
}

export async function cacheSources(sources: SourceOut[]) {
  await db.cachedSources.bulkPut(sources);
}

export async function queueForSync(claimText: string, language: string): Promise<PendingVerification> {
  const entry: PendingVerification = {
    idempotencyKey: `${hashClaim(claimText)}-${Date.now()}`,
    claimText,
    language,
    createdAt: new Date().toISOString(),
    status: "PENDING",
    retryCount: 0,
  };
  const id = await db.pendingVerifications.add(entry);
  return { ...entry, id };
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await db.settings.get(key);
  return row ? (row.value as T) : fallback;
}

export async function setSetting(key: string, value: unknown) {
  await db.settings.put({ key, value });
}
