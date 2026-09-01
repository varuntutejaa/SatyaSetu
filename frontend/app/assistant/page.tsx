"use client";

import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { ConnectivityIndicator } from "@/components/ConnectivityIndicator";
import { FeatureDialogs } from "@/components/WinnerFeatures";
import { VerificationChat } from "@/components/VerificationChat";
import { useAssistantState } from "@/hooks/useAssistantState";

export default function AssistantPage() {
  const assistant = useAssistantState();

  return (
    <main className="premium-shell assistant-shell">
      <header className="premium-nav">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-4 py-4 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-3" href="/" aria-label="SatyaSetu home">
            <div className="brand-orbit"><ShieldCheck size={21} /></div>
            <div>
              <div className="text-base font-black text-white">SatyaSetu</div>
              <div className="text-xs font-bold text-cyan-100/75">National trust infrastructure</div>
            </div>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-bold text-cyan-50/78 lg:flex">
            <button type="button" className="nav-link" onClick={() => assistant.setDialog("forward")}>WhatsApp</button>
            <button type="button" className="nav-link" onClick={() => assistant.setDialog("ivr")}>Voice Agent</button>
            <button type="button" className="nav-link" onClick={() => assistant.result && assistant.setDialog("receipt")} disabled={!assistant.result}>Evidence Receipt</button>
          </nav>
          <div className="flex items-center gap-3">
            <Link className="nav-link flex items-center gap-2" href="/">
              <ArrowLeft size={16} /> Back to home
            </Link>
            <ConnectivityIndicator
              connectivity={assistant.connectivity}
              t={assistant.t}
              pendingCount={assistant.pendingCount}
              isSyncing={assistant.isSyncing}
            />
          </div>
        </div>
      </header>

      <section className="hero-stage assistant-stage">
        <div className="hero-mesh" />
        <div className="relative z-10 mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
          <VerificationChat
            claim={assistant.claim}
            setClaim={assistant.setClaim}
            sentClaim={assistant.sentClaim}
            language={assistant.language}
            setLanguage={assistant.setLanguage}
            result={assistant.result}
            verdict={assistant.verdict}
            sources={assistant.sources}
            apiOnline={assistant.apiOnline}
            isLoading={assistant.isLoading}
            isReporting={assistant.isReporting}
            error={assistant.error}
            notice={assistant.notice}
            verifyClaim={assistant.verifyClaim}
            reportClaim={assistant.reportClaim}
            fileInputRef={assistant.fileInputRef}
            verifyScreenshot={assistant.verifyScreenshot}
            demoClaims={assistant.demoClaims}
            t={assistant.t}
            connectivity={assistant.connectivity}
            pendingCount={assistant.pendingCount}
            recorderState={assistant.recorder.state}
            isTranscribing={assistant.isTranscribing}
            isSpeaking={assistant.isSpeaking}
            toggleRecording={assistant.toggleRecording}
            playExplanation={assistant.playExplanation}
            dataSaver={assistant.dataSaver}
            setDataSaver={assistant.setDataSaver}
            onOpenOfflinePacks={() => assistant.setDialog("packs")}
          />
          <audio ref={assistant.audioRef} className="hidden" aria-hidden="true" />
        </div>
      </section>

      <FeatureDialogs
        claim={assistant.claim}
        result={assistant.result}
        installedPackIds={assistant.installedPackIds}
        isLoading={assistant.isLoading}
        recorderState={assistant.recorder.state}
        dialog={assistant.dialog}
        setDialog={assistant.setDialog}
        onVerifyForward={assistant.verifyForwardedClaim}
        onPickScreenshot={() => assistant.fileInputRef.current?.click()}
        onToggleRecording={assistant.toggleRecording}
        onTogglePack={assistant.toggleOfflinePack}
      />
    </main>
  );
}
