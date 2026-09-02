"use client";

import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Loader2,
  Mic,
  Send,
  ShieldCheck,
  SquareIcon,
  Upload,
  Volume2,
  WifiOff,
  Zap,
} from "lucide-react";
import { useEffect, useRef } from "react";
import type { RefObject } from "react";

import type { SourceOut, VerifyResponse } from "@/services/api";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";
import type { LanguageCode } from "@/lib/i18n";
import type { HistoryEntry } from "@/hooks/useAssistantState";
import { resultHeading } from "@/lib/resultCopy";

const languages = SUPPORTED_LANGUAGES.map(({ code, label }) => [code, label] as [string, string]);

const VERDICT_DOT: Record<string, string> = {
  VERIFIED: "history-dot-verified",
  CONTRADICTED: "history-dot-contradicted",
  UNVERIFIED: "history-dot-unverified",
};

export function VerificationChat({
  claim,
  setClaim,
  sentClaim,
  language,
  setLanguage,
  result,
  verdict,
  sources,
  apiOnline,
  isLoading,
  isReporting,
  error,
  notice,
  history,
  onSelectHistory,
  verifyClaim,
  reportClaim,
  fileInputRef,
  verifyScreenshot,
  demoClaims,
  t,
  connectivity,
  recorderState,
  isTranscribing,
  isSpeaking,
  toggleRecording,
  playExplanation,
}: {
  claim: string;
  setClaim: (value: string) => void;
  sentClaim: string;
  language: LanguageCode;
  setLanguage: (value: LanguageCode) => void;
  result: VerifyResponse | null;
  verdict: { label: string; color: string } | null;
  sources: SourceOut[];
  apiOnline: boolean;
  isLoading: boolean;
  isReporting: boolean;
  error: string;
  notice: string;
  history: HistoryEntry[];
  onSelectHistory: (id: string) => void;
  verifyClaim: () => void;
  reportClaim: () => void;
  fileInputRef: RefObject<HTMLInputElement>;
  verifyScreenshot: (file: File) => void;
  demoClaims: string[];
  t: (key: string, vars?: Record<string, string | number>) => string;
  connectivity: "online" | "weak" | "offline";
  recorderState: "idle" | "recording" | "processing";
  isTranscribing: boolean;
  isSpeaking: boolean;
  toggleRecording: () => void;
  playExplanation: (text: string) => void;
}) {
  const chatBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = chatBodyRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [result, error, notice, isLoading]);

  return (
    <section className="chat-shell" aria-label="SatyaSetu verification chat">
      <div className="chat-sidebar">
        <div>
          <div className="text-xs font-black uppercase text-cyan-200/80">Recent Checks</div>
          <h2 className="mt-2 text-xl font-black text-white">Your questions</h2>
        </div>
        {history.length ? (
          <div className="history-list">
            {history.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={`history-item ${entry.result === result ? "history-item-active" : ""}`}
                onClick={() => onSelectHistory(entry.id)}
              >
                <span className={`history-dot ${VERDICT_DOT[entry.result.verdict] ?? "history-dot-unverified"}`} />
                <span className="history-item-body">
                  <span className="history-item-claim">{entry.claim}</span>
                  <span className="history-item-meta">
                    <Clock3 size={11} /> {new Date(entry.checkedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="history-empty">Verified claims from this session will show up here.</p>
        )}
      </div>

      <div className="chat-main">
        <div className="chat-header">
          <div>
            <div className="text-sm font-black text-slate-950">SatyaSetu Assistant</div>
            <div className="text-xs font-bold text-slate-500">Evidence-backed answers for schemes, fraud, health, and public alerts</div>
          </div>
          <div className="flex items-center gap-2">
            <select className="chat-select" value={language} onChange={(event) => setLanguage(event.target.value as LanguageCode)} aria-label="Chat language">
              {languages.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <span className={apiOnline && connectivity !== "offline" ? "chat-live" : "chat-offline"}>
              {connectivity === "offline" ? <WifiOff size={13} /> : <Zap size={13} />}
              {connectivity === "offline" ? t("connectivity.offline") : apiOnline ? "Ready" : "Reconnecting"}
            </span>
          </div>
        </div>

        <div className="chat-body" ref={chatBodyRef}>
          <div className="assistant-message">
            <div className="avatar assistant-avatar"><ShieldCheck size={18} /></div>
            <div className="message-card">
              <p className="message-kicker">How can I help?</p>
              <p>
                Paste a forward, upload a screenshot, speak a claim, or ask for a simple explanation. I will verify it against official evidence and show my sources.
              </p>
              <div className="action-grid">
                {["Check if a scheme message is real", "Explain this in simple Hindi", "Find official source links", "Create a field-worker response"].map((item) => (
                  <button className="action-chip" key={item} onClick={() => setClaim(item)}>{item}</button>
                ))}
              </div>
            </div>
          </div>

          {sentClaim ? (
            <div className="user-message">
              <div className="message-card user-card">
                <p>{sentClaim}</p>
              </div>
              <div className="avatar user-avatar">You</div>
            </div>
          ) : null}

          {isLoading ? (
            <div className="assistant-message">
              <div className="avatar assistant-avatar"><Loader2 className="animate-spin" size={18} /></div>
              <div className="message-card">
                <p className="message-kicker">Checking trusted sources</p>
                <div className="loading-steps">
                  <span /> Retrieve evidence
                  <span /> Compare claim
                  <span /> Build verdict
                </div>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="assistant-message">
              <div className="avatar warn-avatar"><AlertCircle size={18} /></div>
              <div className="message-card warning-card">{error}</div>
            </div>
          ) : null}

          {notice ? (
            <div className="assistant-message">
              <div className="avatar assistant-avatar"><CheckCircle2 size={18} /></div>
              <div className="message-card result-message">{notice}</div>
            </div>
          ) : null}

          {result && verdict ? (
            <div className="assistant-message">
              <div className="avatar assistant-avatar"><BadgeCheck size={18} /></div>
              <div className="message-card result-message">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className={`verdict-badge ${verdict.color}`}>{verdict.label}</span>
                  <span className="status-pill">{result.confidence} {t("verdict.confidence")}</span>
                  <span className="status-pill">{result.sourceCount} sources</span>
                  {result.offline ? <span className="status-pill">{t("connectivity.offline")}</span> : null}
                  <button className="icon-button icon-button-inline" aria-label={t("verdict.listen")} onClick={() => playExplanation(result.explanation)}>
                    {isSpeaking ? <SquareIcon size={14} /> : <Volume2 size={14} />}
                  </button>
                </div>
                <h3 className="text-lg font-black text-slate-950">{resultHeading(result)}</h3>
                <p className="mt-1 text-xs font-bold text-slate-500">Checked: {result.claim}</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{result.explanation}</p>
                {result.confidenceFactors?.length ? (
                  <ul className="mt-3 grid gap-1">
                    {result.confidenceFactors.map((factor) => (
                      <li className="text-xs font-bold text-slate-500" key={factor}>{factor}</li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-4 grid gap-2">
                  {result.evidence.slice(0, 2).map((item) => (
                    <div className="chat-evidence" key={item.id}>
                      <div className="text-xs font-black text-teal-700">{item.relationship} · {Math.round(item.relevance_score * 100)}%</div>
                      <div className="mt-1 text-sm font-black text-slate-950">{item.document_title}</div>
                      <div className="mt-1 text-xs font-bold text-slate-500">{item.source_name} · {item.source_domain}</div>
                      {item.document_url ? (
                        <a className="mt-1 inline-block text-xs font-bold text-teal-700 underline" href={item.document_url} target="_blank" rel="noopener noreferrer">
                          {t("verdict.viewSource")}
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
                {result.limitations?.length ? (
                  <p className="mt-3 text-xs leading-5 text-amber-700">{result.limitations.join(" ")}</p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {sentClaim ? null : (
          <div className="prompt-row">
            {demoClaims.slice(0, 3).map((item) => (
              <button className="prompt-pill" key={item} onClick={() => setClaim(item)}>{item}</button>
            ))}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) verifyScreenshot(file);
            event.target.value = "";
          }}
        />
        <div className="composer">
          <button className="composer-icon" aria-label="Attach screenshot" onClick={() => fileInputRef.current?.click()}><Upload size={18} /></button>
          <button
            className={`composer-icon ${recorderState === "recording" ? "composer-icon-active" : ""}`}
            aria-label={t("verify.startRecording")}
            onClick={toggleRecording}
            disabled={isTranscribing}
          >
            {isTranscribing ? <Loader2 className="animate-spin" size={18} /> : <Mic size={18} />}
          </button>
          <textarea
            value={claim}
            onChange={(event) => setClaim(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (!isLoading) verifyClaim();
              }
            }}
            placeholder={t("verify.placeholder")}
          />
          <button className="send-button" onClick={verifyClaim} disabled={isLoading} aria-label="Send claim">
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          </button>
        </div>
        <div className="chat-footer-actions">
          <button onClick={reportClaim} disabled={isReporting || isLoading}>
            {isReporting ? <Loader2 className="animate-spin" size={15} /> : <AlertCircle size={15} />}
            {t("report.suspicious")}
          </button>
          <span>{sources.length ? `${sources.length} official sources ready` : "Official sources will appear when connected"}</span>
        </div>
      </div>
    </section>
  );
}
