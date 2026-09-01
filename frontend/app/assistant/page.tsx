"use client";

import { TopNav } from "@/components/TopNav";
import { VerificationChat } from "@/components/VerificationChat";
import { useAssistantState } from "@/hooks/useAssistantState";

export default function AssistantPage() {
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
            recorderState={assistant.recorder.state}
            isTranscribing={assistant.isTranscribing}
            isSpeaking={assistant.isSpeaking}
            toggleRecording={assistant.toggleRecording}
            playExplanation={assistant.playExplanation}
          />
          <audio ref={assistant.audioRef} className="hidden" aria-hidden="true" />
        </div>
      </section>
    </main>
  );
}
