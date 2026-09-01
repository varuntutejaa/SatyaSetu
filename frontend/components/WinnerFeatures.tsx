"use client";

import {
  Check,
  Copy,
  Download,
  Loader2,
  MessageCircleMore,
  Mic,
  PackageCheck,
  QrCode,
  ReceiptText,
  RefreshCw,
  Send,
  Share2,
  ShieldCheck,
  Upload,
  WifiOff,
  X,
} from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";

import { OFFLINE_PACKS } from "@/lib/offlinePacks";
import type { VerifyResponse } from "@/services/api";

type WinnerFeaturesProps = {
  claim: string;
  result: VerifyResponse | null;
  installedPackIds: string[];
  isLoading: boolean;
  recorderState: "idle" | "recording" | "processing";
  onVerifyForward: (text: string) => Promise<void>;
  onPickScreenshot: () => void;
  onToggleRecording: () => void;
  onTogglePack: (packId: string) => void;
};

export function WinnerFeatures({
  claim,
  result,
  installedPackIds,
  isLoading,
  recorderState,
  onVerifyForward,
  onPickScreenshot,
  onToggleRecording,
  onTogglePack,
}: WinnerFeaturesProps) {
  const [dialog, setDialog] = useState<"forward" | "packs" | "receipt" | null>(null);
  const [forwardText, setForwardText] = useState(claim);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedText = [params.get("title"), params.get("text"), params.get("url")].filter(Boolean).join("\n").trim();
    if (sharedText) {
      setForwardText(sharedText);
      setDialog("forward");
    }
  }, []);

  useEffect(() => {
    if (dialog === "forward") setForwardText(claim);
  }, [claim, dialog]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setDialog(null);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  return (
    <>
      <section className="winner-launchpad" aria-label="Fast verification tools">
        <button className="winner-action winner-action-primary" onClick={() => setDialog("forward")}>
          <span className="winner-action-icon"><MessageCircleMore size={22} /></span>
          <span><strong>Forward a message</strong><small>Paste a WhatsApp forward, voice note or screenshot</small></span>
          <span className="winner-arrow">01</span>
        </button>
        <button className="winner-action" onClick={() => setDialog("packs")}>
          <span className="winner-action-icon"><PackageCheck size={22} /></span>
          <span><strong>Offline trust packs</strong><small>{installedPackIds.length ? `${installedPackIds.length} saved on this phone` : "Verify essentials without internet"}</small></span>
          <span className="winner-arrow">02</span>
        </button>
        <button className="winner-action" onClick={() => setDialog("receipt")} disabled={!result}>
          <span className="winner-action-icon"><ReceiptText size={22} /></span>
          <span><strong>Evidence receipt</strong><small>{result ? "Listen, copy or share the correction" : "Available after verification"}</small></span>
          <span className="winner-arrow">03</span>
        </button>
      </section>

      {dialog === "forward" ? (
        <Dialog title="Forward to SatyaSetu" subtitle="Check it before you trust it or send it on." onClose={() => setDialog(null)}>
          <div className="channel-badge"><MessageCircleMore size={16} /> WhatsApp-ready verification</div>
          <label className="modal-label" htmlFor="forwarded-message">Message you received</label>
          <textarea
            id="forwarded-message"
            className="forward-textarea"
            value={forwardText}
            onChange={(event) => setForwardText(event.target.value)}
            placeholder="Paste the forwarded message here…"
            autoFocus
          />
          <div className="forward-inputs">
            <button onClick={onPickScreenshot}><Upload size={18} /> Screenshot</button>
            <button className={recorderState === "recording" ? "recording" : ""} onClick={onToggleRecording}>
              <Mic size={18} /> {recorderState === "recording" ? "Stop recording" : "Voice note"}
            </button>
          </div>
          <button
            className="modal-primary"
            disabled={isLoading || forwardText.trim().length < 3}
            onClick={async () => {
              await onVerifyForward(forwardText);
              setDialog(null);
            }}
          >
            {isLoading ? <Loader2 className="animate-spin" size={19} /> : <Send size={19} />}
            Check this message
          </button>
          <p className="privacy-line"><ShieldCheck size={15} /> Screenshots are processed in memory and are not saved.</p>
        </Dialog>
      ) : null}

      {dialog === "packs" ? (
        <Dialog title="Offline trust packs" subtitle="Save small, official-information packs for weak or unavailable internet." onClose={() => setDialog(null)} wide>
          <div className="offline-banner"><WifiOff size={18} /><span><strong>Works without a connection</strong>Installed packs are checked on this device and always display their update date.</span></div>
          <div className="pack-grid">
            {OFFLINE_PACKS.map((pack) => {
              const installed = installedPackIds.includes(pack.id);
              return (
                <article className={`pack-card ${installed ? "pack-card-installed" : ""}`} key={pack.id}>
                  <div className="pack-card-top">
                    <span className="pack-icon">{installed ? <Check size={20} /> : <Download size={20} />}</span>
                    <span className="pack-size">{pack.size}</span>
                  </div>
                  <h3>{pack.title}</h3>
                  <p>{pack.description}</p>
                  <div className="pack-meta">{pack.sourceCount} official sources · Updated {pack.updatedAt}</div>
                  <button onClick={() => onTogglePack(pack.id)}>
                    {installed ? <><RefreshCw size={16} /> Saved on device</> : <><Download size={16} /> Download pack</>}
                  </button>
                </article>
              );
            })}
          </div>
          <p className="pack-disclaimer">Offline packs never silently claim to be live. SatyaSetu shows the saved date and asks users to reconnect for recent changes.</p>
        </Dialog>
      ) : null}

      {dialog === "receipt" && result ? <ReceiptDialog result={result} onClose={() => setDialog(null)} /> : null}
    </>
  );
}

function Dialog({
  title,
  subtitle,
  onClose,
  wide = false,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`feature-modal ${wide ? "feature-modal-wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby="feature-dialog-title">
        <div className="modal-heading">
          <div><h2 id="feature-dialog-title">{title}</h2><p>{subtitle}</p></div>
          <button className="modal-close" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>
        {children}
      </section>
    </div>
  );
}

function ReceiptDialog({ result, onClose }: { result: VerifyResponse; onClose: () => void }) {
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
    <Dialog title="Evidence receipt" subtitle="A small proof card made to be understood and forwarded." onClose={onClose}>
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
    </Dialog>
  );
}
