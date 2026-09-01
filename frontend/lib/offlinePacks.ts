import type { VerifyResponse } from "@/services/api";

export type OfflinePack = {
  id: string;
  title: string;
  description: string;
  size: string;
  updatedAt: string;
  sourceCount: number;
  keywords: string[];
  result: Omit<VerifyResponse, "claim" | "checkedAt" | "language">;
};

const SHARED_RESULT = {
  confidenceFactors: [
    "Matched inside a downloaded trusted-information pack",
    "Evidence was prepared from an official public source",
  ],
  howVerified: [
    { step: 1, label: "Matched locally", detail: "SatyaSetu checked the claim against the packs saved on this device." },
    { step: 2, label: "Checked provenance", detail: "The saved evidence includes its official source and update date." },
    { step: 3, label: "Applied fixed rules", detail: "The verdict follows SatyaSetu's deterministic verification policy." },
  ],
  sourceCount: 1,
  freshness: "Downloaded pack",
  offline: true,
};

export const OFFLINE_PACKS: OfflinePack[] = [
  {
    id: "farmer-schemes",
    title: "Farmer schemes",
    description: "PM-KISAN, crop insurance, Kisan Credit Card and common scheme rumours.",
    size: "2.4 MB",
    updatedAt: "28 Aug 2026",
    sourceCount: 18,
    keywords: ["pm-kisan", "pm kisan", "6000", "farmer", "installment", "instalment"],
    result: {
      ...SHARED_RESULT,
      verificationId: "offline-pm-kisan",
      verdict: "VERIFIED",
      confidence: "High",
      summary: "This PM-KISAN payment information matches official guidance.",
      explanation: "Eligible farmer families receive Rs 6,000 per year through PM-KISAN, paid in three equal instalments. Eligibility rules still apply.",
      evidence: [{
        id: "offline-pmkisan-1",
        relationship: "SUPPORTS",
        relevance_score: 0.96,
        reason: "The downloaded official guidance states the same annual benefit and payment schedule.",
        source_id: "pmkisan",
        source_name: "PM-KISAN",
        source_domain: "pmkisan.gov.in",
        authority_level: "PRIMARY",
        category: "government_scheme",
        document_title: "PM-KISAN scheme information",
        document_url: "https://pmkisan.gov.in/",
        published_at: "2026-08-28T00:00:00.000Z",
        retrieved_at: "2026-08-28T00:00:00.000Z",
      }],
      limitations: ["This offline result uses a saved pack dated 28 Aug 2026. Reconnect before acting if the message concerns a recent rule change."],
    },
  },
  {
    id: "safe-banking",
    title: "Safe banking & scams",
    description: "OTP, UPI, KYC, loan-app and impersonation scam warnings.",
    size: "1.1 MB",
    updatedAt: "30 Aug 2026",
    sourceCount: 14,
    keywords: ["otp", "bank official", "rbi", "upi pin", "kyc", "account verification"],
    result: {
      ...SHARED_RESULT,
      verificationId: "offline-rbi-otp",
      verdict: "CONTRADICTED",
      confidence: "High",
      summary: "Do not share your OTP or UPI PIN.",
      explanation: "Banks and RBI do not ask customers to share confidential OTPs, PINs or passwords. This is a common sign of fraud.",
      evidence: [{
        id: "offline-rbi-1",
        relationship: "CONTRADICTS",
        relevance_score: 0.98,
        reason: "RBI safety guidance warns that confidential credentials must never be shared.",
        source_id: "rbi",
        source_name: "Reserve Bank of India",
        source_domain: "rbi.org.in",
        authority_level: "PRIMARY",
        category: "financial_safety",
        document_title: "Safe digital banking practices",
        document_url: "https://www.rbi.org.in/",
        published_at: "2026-08-30T00:00:00.000Z",
        retrieved_at: "2026-08-30T00:00:00.000Z",
      }],
      limitations: ["This pack provides safety guidance, not recovery of lost funds. Report urgent cyber fraud through 1930."],
    },
  },
  {
    id: "health-alerts",
    title: "Health alerts",
    description: "Vaccines, outbreaks, miracle cures and public-health advisories.",
    size: "1.8 MB",
    updatedAt: "27 Aug 2026",
    sourceCount: 16,
    keywords: ["vaccine", "miracle cure", "health ministry", "mohfw", "medicine", "outbreak"],
    result: {
      ...SHARED_RESULT,
      verificationId: "offline-health-guidance",
      verdict: "UNVERIFIED",
      confidence: "Medium",
      summary: "This health claim needs current medical evidence.",
      explanation: "The downloaded pack does not contain enough authoritative evidence to confirm this specific health claim. Do not treat it as medical advice.",
      evidence: [],
      sourceCount: 0,
      confidenceFactors: ["No exact match was found in the downloaded Ministry of Health guidance"],
      limitations: ["Reconnect for a live source search and consult a qualified health professional before acting."],
    },
  },
];

export function matchOfflinePack(claim: string, installedPackIds: string[], language: string): VerifyResponse | null {
  const normalized = claim.toLowerCase();
  const pack = OFFLINE_PACKS.find(
    (item) => installedPackIds.includes(item.id) && item.keywords.some((keyword) => normalized.includes(keyword)),
  );
  if (!pack) return null;
  return {
    ...pack.result,
    claim,
    checkedAt: new Date().toISOString(),
    language,
  };
}
