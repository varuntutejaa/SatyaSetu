"use client";

import { Check, Copy, QrCode, ReceiptText, Share2, ShieldCheck } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";

import { TopNav } from "@/components/TopNav";
import { useAssistantState } from "@/hooks/useAssistantState";

export default function EvidenceReceiptPage() {
  const assistant = useAssistantState();
  const result = assistant.result;

  return (
    <main className="premium-shell assistant-shell">
      <TopNav
        connectivity={assistant.connectivity}
        t={assistant.t}
        pendingCount={assistant.pendingCount}
        isSyncing={assistant.isSyncing}
      />

      <section className="hero-stage assistant-stage">
        <div className="hero-mesh" />
        <div className="relative z-10 mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <span className="premium-pill hero-kicker"><ReceiptText size={14} /> Evidence Receipt</span>
            <h1 className="hero-title hero-title-scheme">A proof card you can share</h1>
            <p className="hero-subheadline">Made to be understood and forwarded.</p>
          </div>

          {result ? (
            <ReceiptCard result={result} />
          ) : (
            <div className="feature-modal feature-modal-embedded mx-auto max-w-xl text-center">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-teal-50 text-teal-700 mx-auto">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-950">No verification yet on this page</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Verify a scheme claim via the AI Assistant or WhatsApp first, and its receipt will appear here.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <a className="hero-primary inline-flex" href="/assistant">Go to AI Assistant</a>
                <a className="hero-primary inline-flex" href="/whatsapp">Go to WhatsApp</a>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function ReceiptCard({ result }: { result: NonNullable<ReturnType<typeof useAssistantState>["result"]> }) {
  const [qrUrl, setQrUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const source = result.evidence[0];
  const receiptText = useMemo(
    () => `SatyaSetu: ${result.verdict}\n${result.summary}\nConfidence: ${result.confidence}\n${source ? `Official source: ${source.source_domain}` : "No authoritative source confirmed this claim."}\nChecked: ${new Date(result.checkedAt).toLocaleString()}`,
    [result, source],
  );

  useEffect(() => {
    const target = source?.document_url || window.location.href.split("?")[0];
    QRCode.toDataURL(target, { width: 220, margin: 1, color: { dark: "#082f49", light: "#ffffff" } })
      .then(setQrUrl)
      .catch(() => setQrUrl(""));
  }, [source]);

  async function copyReceipt() {
    await navigator.clipboard.writeText(receiptText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function shareReceipt() {
    if (navigator.share) {
      await navigator.share({ title: "SatyaSetu evidence receipt", text: receiptText });
      return;
    }
    await copyReceipt();
  }

  const verdictClass = result.verdict === "VERIFIED" ? "receipt-good" : result.verdict === "CONTRADICTED" ? "receipt-bad" : "receipt-warn";

  return (
    <div className="feature-modal feature-modal-embedded mx-auto max-w-xl">
      <article className={`evidence-receipt ${verdictClass}`} id="evidence-receipt">
        <div className="receipt-brand"><span><ShieldCheck size={18} /> SatyaSetu</span><small>Evidence before belief</small></div>
        <div className="receipt-verdict">{result.verdict === "UNVERIFIED" ? "NEEDS EVIDENCE" : result.verdict}</div>
        <h3>{result.summary}</h3>
        <p>{result.explanation}</p>
        <div className="receipt-grid">
          <div><small>Confidence</small><strong>{result.confidence}</strong></div>
          <div><small>Official sources</small><strong>{result.sourceCount}</strong></div>
          <div><small>Checked</small><strong>{new Date(result.checkedAt).toLocaleDateString()}</strong></div>
        </div>
        <div className="receipt-proof">
          <div><small>Primary evidence</small><strong>{source?.source_name || "No conclusive evidence"}</strong><span>{source?.source_domain || "Reconnect for a live search"}</span></div>
          {qrUrl ? <img src={qrUrl} alt="QR code to official evidence" width={94} height={94} /> : <div className="qr-placeholder"><QrCode size={36} /></div>}
        </div>
        <div className="receipt-footnote">Community reports do not decide this verdict. Evidence and fixed verification rules do.</div>
      </article>
      <div className="receipt-actions">
        <button onClick={copyReceipt}>{copied ? <Check size={17} /> : <Copy size={17} />}{copied ? "Copied" : "Copy correction"}</button>
        <button className="receipt-share" onClick={shareReceipt}><Share2 size={17} /> Share receipt</button>
      </div>
    </div>
  );
}
