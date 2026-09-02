"use client";

import { Copy, ExternalLink, MessageCircleMore, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { TopNav } from "@/components/TopNav";
import { useAssistantState } from "@/hooks/useAssistantState";

const SANDBOX_NUMBER = "+14155238886";
const WHATSAPP_URL = "https://wa.me/14155238886";

export default function WhatsAppPage() {
  const assistant = useAssistantState();
  const [copied, setCopied] = useState(false);

  async function copyNumber() {
    await navigator.clipboard.writeText(SANDBOX_NUMBER);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main className="premium-shell assistant-shell">
      <TopNav
        connectivity={assistant.connectivity}
        t={assistant.t}
        pendingCount={assistant.pendingCount}
        isSyncing={assistant.isSyncing}
      />

      <section className="hero-stage assistant-stage">
        <div className="relative z-10 mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <span className="premium-pill hero-kicker"><MessageCircleMore size={14} /> WhatsApp Help</span>
            <h1 className="hero-title hero-title-scheme">Chat With SatyaSetu On WhatsApp</h1>
            <p className="hero-subheadline">
              Send a scheme message or question on WhatsApp and get a clear answer with official proof.
            </p>
          </div>

          <section className="whatsapp-redirect-card">
            <div className="whatsapp-number-box">
              <span>Sandbox number</span>
              <strong>{SANDBOX_NUMBER}</strong>
            </div>

            <div className="whatsapp-actions">
              <a className="whatsapp-open-button" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <MessageCircleMore size={20} />
                Open WhatsApp Chat
                <ExternalLink size={17} />
              </a>
              <button className="whatsapp-copy-button" onClick={copyNumber}>
                <Copy size={18} />
                {copied ? "Copied" : "Copy Number"}
              </button>
            </div>

            <div className="whatsapp-steps">
              <h2>How to chat</h2>
              <ol>
                <li>Tap “Open WhatsApp Chat”.</li>
                <li>If WhatsApp asks, open the chat with {SANDBOX_NUMBER}.</li>
                <li>Send your scheme message, fraud alert, or question.</li>
                <li>Wait for SatyaSetu to reply with the result and proof.</li>
              </ol>
            </div>

            <div className="whatsapp-example">
              <div><ShieldCheck size={18} /> Example message</div>
              <p>Is PM-KISAN giving eligible farmer families Rs 6,000 per year?</p>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
