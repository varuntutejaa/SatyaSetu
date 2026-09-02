export type Evidence = {
  id: string;
  relationship: string;
  relevance_score: number;
  reason: string;
  source_id: string;
  source_name: string;
  source_domain: string;
  authority_level: string;
  category: string;
  document_title: string;
  document_url: string;
  published_at: string;
  retrieved_at: string;
};

export type VerifyResponse = {
  verificationId: string;
  verdict: string;
  confidence: string;
  claim: string;
  summary: string;
  explanation: string;
  evidence: Evidence[];
  confidenceFactors: string[];
  howVerified: Array<{ step: number; label: string; detail: string }>;
  sourceCount: number;
  freshness: string;
  limitations: string[];
  checkedAt: string;
  offline: boolean;
  language: string;
};

export type SourceOut = {
  id: string;
  name: string;
  domain: string;
  category: string;
  authority_level: string;
  description: string;
  verification_status: string;
  last_checked: string;
  allowed_for_verification: boolean;
  active: boolean;
};

export type HealthResponse = {
  status: string;
  service: string;
};

export type ReportResponse = {
  id: string;
  claim_id: string;
  total_reports_for_claim: number;
  message: string;
};

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: init?.body instanceof FormData
      ? init.headers
      : { "Content-Type": "application/json", ...init?.headers },
  });

  if (!response.ok) {
    let message = "Backend request failed.";
    try {
      const body = await response.json();
      message = body.detail ?? message;
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function getHealth() {
  return request<HealthResponse>("/api/health");
}

export type DemoClaim = { claim: string; category: string; expected_verdict: string };

export function getDemoClaims() {
  return request<DemoClaim[]>("/api/demo-claims");
}

export function getSources() {
  return request<SourceOut[]>("/api/sources");
}

export function verifyClaim(text: string, language?: string) {
  return request<VerifyResponse>("/api/verify", {
    method: "POST",
    body: JSON.stringify({ text, language }),
  });
}

export function verifyImage(file: File) {
  const form = new FormData();
  form.append("file", file);
  return request<VerifyResponse>("/api/ocr", {
    method: "POST",
    body: form,
  });
}

export function submitReport(claimText: string, reportType = "SUSPICIOUS", seenBefore = true) {
  return request<ReportResponse>("/api/reports", {
    method: "POST",
    body: JSON.stringify({
      claim_text: claimText,
      report_type: reportType,
      seen_before: seenBefore,
    }),
  });
}

export type STTResponse = { text: string; language: string; confidence: number };

function audioFileName(audioBlob: Blob) {
  const mimeType = audioBlob.type.split(";")[0];
  const extension = {
    "audio/wav": "wav",
    "audio/webm": "webm",
    "audio/mpeg": "mp3",
    "audio/mp4": "m4a",
    "audio/ogg": "ogg",
  }[mimeType] ?? "webm";
  return `recording.${extension}`;
}

export function speechToText(audioBlob: Blob, languageHint?: string) {
  const form = new FormData();
  form.append("file", audioBlob, audioFileName(audioBlob));
  if (languageHint) form.append("language_hint", languageHint);
  return request<STTResponse>("/api/stt", { method: "POST", body: form });
}

export type TTSResponse = { audio_base64: string; mime_type: string };

export function textToSpeech(text: string, language: string) {
  return request<TTSResponse>("/api/tts", {
    method: "POST",
    body: JSON.stringify({ text, language }),
  });
}

export type VoiceAgentResponse = {
  transcript: string;
  transcript_language: string;
  verification: VerifyResponse;
  spoken_text: string;
  audio_base64: string;
  mime_type: string;
};

export function runVoiceAgent(audioBlob: Blob, languageHint?: string) {
  const form = new FormData();
  form.append("file", audioBlob, audioFileName(audioBlob));
  if (languageHint) form.append("language_hint", languageHint);
  return request<VoiceAgentResponse>("/api/voice-agent", { method: "POST", body: form });
}

export type SyncItem = { idempotency_key: string; claim_text: string; language?: string };
export type SyncResultItem = { idempotency_key: string; status: string; verification_id?: string; error?: string };

export function syncPending(items: SyncItem[]) {
  return request<{ results: SyncResultItem[] }>("/api/sync", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}
