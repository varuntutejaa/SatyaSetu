"use client";

import { Loader2, Mic, MessageCircleMore, Send, ShieldCheck, Upload } from "lucide-react";

import { TopNav } from "@/components/TopNav";
import { EmptyResult, ResultPanel } from "@/components/ResultPanel";
import { useAssistantState } from "@/hooks/useAssistantState";

export default function WhatsAppPage() {
  const assistant = useAssistantState();

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
        <div className="relative z-10 mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <span className="premium-pill hero-kicker"><MessageCircleMore size={14} /> WhatsApp channel</span>
            <h1 className="hero-title hero-title-scheme">Forward to SatyaSetu</h1>
            <p className="hero-subheadline">Check it before you trust it or send it on.</p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
            <section className="demo-panel">
              <div className="channel-badge"><MessageCircleMore size={16} /> WhatsApp-ready verification</div>
              <label className="modal-label" htmlFor="forwarded-message">Message you received</label>
              <textarea
                id="forwarded-message"
                className="forward-textarea"
                value={assistant.claim}
                onChange={(event) => assistant.setClaim(event.target.value)}
                placeholder="Paste the forwarded message here…"
                autoFocus
              />
              <div className="forward-inputs">
                <button onClick={() => assistant.fileInputRef.current?.click()}><Upload size={18} /> Screenshot</button>
                <button className={assistant.recorder.state === "recording" ? "recording" : ""} onClick={assistant.toggleRecording}>
                  <Mic size={18} /> {assistant.recorder.state === "recording" ? "Stop recording" : "Voice note"}
                </button>
              </div>
              <input
                ref={assistant.fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) assistant.verifyScreenshot(file);
                  event.target.value = "";
                }}
              />
              <button
                className="modal-primary"
                disabled={assistant.isLoading || assistant.claim.trim().length < 3}
                onClick={() => assistant.verifyForwardedClaim(assistant.claim)}
              >
                {assistant.isLoading ? <Loader2 className="animate-spin" size={19} /> : <Send size={19} />}
                Check this message
              </button>
              <p className="privacy-line"><ShieldCheck size={15} /> Screenshots are processed in memory and are not saved.</p>
              {assistant.error ? <div className="error-strip"><ShieldCheck size={18} /> {assistant.error}</div> : null}
              {assistant.notice ? <div className="error-strip notice-strip"><ShieldCheck size={18} /> {assistant.notice}</div> : null}
            </section>
            <section className={`demo-panel ${assistant.verdict?.className ?? ""}`}>
              {assistant.result && assistant.verdict ? (
                <ResultPanel
                  result={assistant.result}
                  verdict={assistant.verdict}
                  t={assistant.t}
                  isSpeaking={assistant.isSpeaking}
                  playExplanation={assistant.playExplanation}
                />
              ) : (
                <EmptyResult />
              )}
            </section>
          </div>
          <audio ref={assistant.audioRef} className="hidden" aria-hidden="true" />
        </div>
      </section>
    </main>
  );
}
