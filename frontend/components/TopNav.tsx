"use client";

import { AlertCircle, BadgeCheck, Loader2, Mic, ShieldCheck, SquareIcon, Volume2, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";

import { ConnectivityIndicator } from "@/components/ConnectivityIndicator";
import { SUPPORTED_LANGUAGES, useLanguage } from "@/lib/i18n";
import type { LanguageCode } from "@/lib/i18n";
import { speechToText, textToSpeech, verifyClaim } from "@/services/api";
import type { VerifyResponse } from "@/services/api";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";

const NAV_LINKS = [
  { href: "/whatsapp", label: "WhatsApp" },
  { href: "/assistant", label: "AI Assistant" },
  { href: "/evidence-receipt", label: "Evidence Receipt" },
];

const MAX_RECORDING_SECONDS = 12;

export function TopNav({
  connectivity,
  t,
  pendingCount,
  isSyncing,
}: {
  connectivity: "online" | "weak" | "offline";
  t: (key: string, vars?: Record<string, string | number>) => string;
  pendingCount: number;
  isSyncing: boolean;
}) {
  const pathname = usePathname();
  const voiceAgent = useNavbarVoiceAgent();

  return (
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
          <button
            type="button"
            className={`nav-link nav-button ${voiceAgent.open ? "nav-link-active" : ""}`}
            onClick={voiceAgent.openAgent}
          >
            Voice Agent
          </button>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              className={`nav-link ${pathname === link.href ? "nav-link-active" : ""}`}
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <button type="button" className="nav-voice-button lg:hidden" onClick={voiceAgent.openAgent} aria-label="Open voice agent">
            <Mic size={18} />
          </button>
          <ConnectivityIndicator connectivity={connectivity} t={t} pendingCount={pendingCount} isSyncing={isSyncing} />
        </div>
      </div>
      <NavbarVoiceAgent {...voiceAgent} />
    </header>
  );
}

function useNavbarVoiceAgent() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [status, setStatus] = useState("Tap the mic and speak a claim.");
  const [error, setError] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const speakResult = useCallback(async (response: VerifyResponse, lang: LanguageCode) => {
    const spoken = [
      `Verdict: ${response.verdict === "UNVERIFIED" ? "Needs evidence" : response.verdict}.`,
      response.summary,
      response.explanation,
    ].join(" ").slice(0, 900);

    const speech = await textToSpeech(spoken, lang);
    if (!audioRef.current) return;
    audioRef.current.src = `data:${speech.mime_type};base64,${speech.audio_base64}`;
    audioRef.current.onended = () => setIsSpeaking(false);
    setIsSpeaking(true);
    await audioRef.current.play();
  }, []);

  const processAudio = useCallback(async (blob: Blob) => {
    setIsWorking(true);
    setError("");
    setStatus("Transcribing with Sarvam...");
    try {
      const stt = await speechToText(blob, language);
      const spokenText = stt.text.trim();
      if (spokenText.length < 3) throw new Error("Could not hear a complete claim. Please try again.");
      setTranscript(spokenText);
      setStatus("Checking official evidence through the RAG pipeline...");
      const verified = await verifyClaim(spokenText, stt.language as LanguageCode || language);
      setResult(verified);
      setStatus("Speaking the evidence-backed response...");
      await speakResult(verified, (stt.language as LanguageCode) || language);
      setStatus("Done. You can ask another claim.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Voice agent failed. Check SARVAM_API_KEY and backend status.");
      setStatus("Tap the mic and try again.");
    } finally {
      setIsWorking(false);
    }
  }, [language, speakResult]);

  const recorder = useVoiceRecorder(MAX_RECORDING_SECONDS * 1000, processAudio);

  async function toggleRecording() {
    setError("");
    if (recorder.state === "recording") {
      const blob = await recorder.stop();
      if (blob) await processAudio(blob);
      return;
    }
    setTranscript("");
    setResult(null);
    setStatus(`Listening for up to ${MAX_RECORDING_SECONDS} seconds...`);
    await recorder.start();
    if (recorder.error) setError(recorder.error);
  }

  function stopSpeaking() {
    audioRef.current?.pause();
    setIsSpeaking(false);
  }

  return {
    open,
    openAgent: () => setOpen(true),
    closeAgent: () => setOpen(false),
    language,
    setLanguage,
    recorderState: recorder.state,
    transcript,
    result,
    status,
    error,
    isWorking,
    isSpeaking,
    toggleRecording,
    stopSpeaking,
    audioRef,
  };
}

function NavbarVoiceAgent({
  open,
  closeAgent,
  language,
  setLanguage,
  recorderState,
  transcript,
  result,
  status,
  error,
  isWorking,
  isSpeaking,
  toggleRecording,
  stopSpeaking,
  audioRef,
}: ReturnType<typeof useNavbarVoiceAgent>) {
  const verdictLabel = useMemo(() => {
    if (!result) return "Awaiting claim";
    return result.verdict === "UNVERIFIED" ? "Needs evidence" : result.verdict;
  }, [result]);

  if (!open) return <audio ref={audioRef} className="hidden" aria-hidden="true" />;

  return (
    <div className="voice-agent-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeAgent()}>
      <section className="voice-agent-modal" role="dialog" aria-modal="true" aria-labelledby="voice-agent-title">
        <div className="voice-agent-head">
          <div>
            <p>Sarvam voice agent</p>
            <h2 id="voice-agent-title">Speak in any supported language</h2>
          </div>
          <button type="button" onClick={closeAgent} aria-label="Close voice agent"><X size={20} /></button>
        </div>

        <div className="voice-agent-language-row">
          {SUPPORTED_LANGUAGES.map((item) => (
            <button
              key={item.code}
              type="button"
              className={language === item.code ? "voice-lang-active" : ""}
              onClick={() => setLanguage(item.code)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className={`voice-agent-orb ${recorderState === "recording" ? "voice-agent-orb-live" : ""}`}>
          {isWorking ? <Loader2 className="animate-spin" size={42} /> : recorderState === "recording" ? <SquareIcon size={42} /> : <Mic size={42} />}
        </div>

        <p className="voice-agent-status">{status}</p>
        <p className="voice-agent-limit">Mic auto-stops at {MAX_RECORDING_SECONDS}s to keep Sarvam calls minimal: STT once, RAG once, TTS once.</p>

        <button type="button" className="voice-agent-primary" onClick={toggleRecording} disabled={isWorking || recorderState === "processing"}>
          {recorderState === "recording" ? <SquareIcon size={18} /> : <Mic size={18} />}
          {recorderState === "recording" ? "Stop and verify" : "Start voice verification"}
        </button>

        {isSpeaking ? (
          <button type="button" className="voice-agent-secondary" onClick={stopSpeaking}>
            <Volume2 size={17} /> Stop audio
          </button>
        ) : null}

        {error ? <div className="voice-agent-error"><AlertCircle size={17} /> {error}</div> : null}

        {transcript ? (
          <div className="voice-agent-card">
            <span>Transcribed claim</span>
            <p>{transcript}</p>
          </div>
        ) : null}

        {result ? (
          <div className="voice-agent-card voice-agent-result">
            <span><BadgeCheck size={15} /> {verdictLabel} · {result.confidence}</span>
            <h3>{result.summary}</h3>
            <p>{result.explanation}</p>
            <small>{result.sourceCount} official source{result.sourceCount === 1 ? "" : "s"} checked through RAG.</small>
          </div>
        ) : null}

        <audio ref={audioRef} className="hidden" aria-hidden="true" />
      </section>
    </div>
  );
}
