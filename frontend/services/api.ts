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

export function getDemoClaims() {
  return request<Array<string | { text?: string; claim?: string }>>("/api/demo-claims");
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
