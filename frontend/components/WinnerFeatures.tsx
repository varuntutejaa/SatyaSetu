"use client";

import { AudioLines, Check, Download, MessageCircleMore, ReceiptText, RefreshCw, ShieldCheck, WifiOff, X } from "lucide-react";
import Link from "next/link";

import { OFFLINE_PACKS } from "@/lib/offlinePacks";

export type FeatureDialog = "packs" | null;

export function WinnerFeatures() {
  return (
    <section className="winner-launchpad" aria-label="Fast verification tools">
      <Link href="/whatsapp" className="winner-action winner-action-primary">
        <span className="winner-action-icon"><MessageCircleMore size={22} /></span>
        <span><strong>WhatsApp</strong><small>Forward a scheme message, screenshot or voice note</small></span>
        <span className="winner-arrow">01</span>
      </Link>
      <Link href="/voice-agent" className="winner-action winner-action-call">
        <span className="winner-action-icon"><AudioLines size={22} /></span>
        <span><strong>Instant Voice Agent</strong><small>Ask about a government scheme in your language, voice to voice</small></span>
        <span className="winner-arrow">AI</span>
      </Link>
      <Link href="/assistant" className="winner-action">
        <span className="winner-action-icon"><ShieldCheck size={22} /></span>
        <span><strong>SatyaSetu AI Assistant</strong><small>Type or speak a scheme claim right here on the page</small></span>
        <span className="winner-arrow">02</span>
      </Link>
      <Link href="/evidence-receipt" className="winner-action">
        <span className="winner-action-icon"><ReceiptText size={22} /></span>
        <span><strong>Evidence Receipt</strong><small>View, listen to, or share your latest verification</small></span>
        <span className="winner-arrow">03</span>
      </Link>
    </section>
  );
}

export function OfflinePacksDialog({
  installedPackIds,
  onTogglePack,
  onClose,
}: {
  installedPackIds: string[];
  onTogglePack: (packId: string) => void;
  onClose: () => void;
}) {
  return (
    <Dialog title="Offline trust packs" subtitle="Save small, official-information packs for weak or unavailable internet." onClose={onClose} wide>
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
  );
}

export function Dialog({
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
