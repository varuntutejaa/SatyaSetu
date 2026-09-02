import type { VerifyResponse } from "@/services/api";

export function resultHeading(result: VerifyResponse) {
  const summary = result.summary.trim();
  const claim = result.claim.trim();
  if (summary && summary !== claim) return summary;

  const topEvidence = [...result.evidence].sort((a, b) => b.relevance_score - a.relevance_score)[0];
  if (result.verdict === "VERIFIED") {
    return topEvidence
      ? `This is verified by ${topEvidence.source_name}.`
      : "This is verified by official information.";
  }
  if (result.verdict === "CONTRADICTED") {
    return topEvidence
      ? `This conflicts with ${topEvidence.source_name}.`
      : "This conflicts with official information.";
  }
  if (topEvidence) return "Official sources do not give one clear answer yet.";
  return "This cannot be confirmed from official sources yet.";
}
