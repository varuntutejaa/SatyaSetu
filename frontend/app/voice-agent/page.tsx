"use client";

import { AudioLines } from "lucide-react";

import { TopNav } from "@/components/TopNav";
import { IvrSimulator } from "@/components/IvrSimulator";
import { useAssistantState } from "@/hooks/useAssistantState";

export default function VoiceAgentPage() {
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
        <div className="relative z-10 mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <span className="premium-pill hero-kicker"><AudioLines size={14} /> Instant Voice Agent</span>
            <h1 className="hero-title hero-title-scheme">Ask, in your language</h1>
            <p className="hero-subheadline">Speak a government-scheme claim, voice to voice.</p>
          </div>

          <IvrSimulator
            open
            embedded
            onClose={() => {}}
            claim={assistant.claim}
            recorderState={assistant.recorder.state}
            onToggleRecording={assistant.toggleRecording}
            onVerify={assistant.verifyForwardedClaim}
          />
        </div>
      </section>
    </main>
  );
}
