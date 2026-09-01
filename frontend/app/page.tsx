"use client";

import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Cloud,
  Database,
  FileSearch,
  Fingerprint,
  Globe2,
  Languages,
  Landmark,
  Loader2,
  LockKeyhole,
  Mic,
  PhoneCall,
  Play,
  Radio,
  ScanText,
  Send,
  ShieldCheck,
  Sparkles,
  SquareIcon,
  Upload,
  Users,
  Volume2,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import {
  getDemoClaims,
  getHealth,
  getSources,
  speechToText,
  submitReport,
  textToSpeech,
  verifyClaim as verifyClaimRequest,
  verifyImage,
} from "@/services/api";
import type { SourceOut, VerifyResponse } from "@/services/api";
import { useLanguage, SUPPORTED_LANGUAGES } from "@/lib/i18n";
import type { LanguageCode } from "@/lib/i18n";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useSyncQueue } from "@/hooks/useSyncQueue";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { compressImage } from "@/lib/imageCompress";
import { cacheSources, cacheVerification, getCachedVerification, getSetting, setSetting } from "@/lib/db";
import { matchOfflinePack } from "@/lib/offlinePacks";
import { WinnerFeatures } from "@/components/WinnerFeatures";

const fallbackClaims = [
  "PM-KISAN gives eligible farmer families Rs 6,000 per year in three installments.",
  "RBI asks citizens to share OTPs with bank officials for account verification.",
  "Aadhaar is mandatory for every school admission in India.",
  "Report cyber fraud quickly through the national cybercrime portal or helpline 1930.",
];

const languages = SUPPORTED_LANGUAGES.map(({ code, label }) => [code, label] as [string, string]);

const verdictStyles: Record<string, { label: string; className: string; color: string }> = {
  VERIFIED: { label: "Verified", className: "verdict-verified", color: "text-emerald-700" },
  CONTRADICTED: { label: "Contradicted", className: "verdict-contradicted", color: "text-rose-700" },
  UNVERIFIED: { label: "Needs Evidence", className: "verdict-unverified", color: "text-amber-700" },
};

const operatingStats = [
  ["12+", "official registries ready"],
  ["8", "language surfaces"],
  ["0", "LLM verdict control"],
  ["<3s", "demo response target"],
];

const flowSteps = [
  { icon: ScanText, title: "Capture", text: "Voice, screenshot, pasted forward, kiosk entry, or field worker submission enters one queue." },
  { icon: Database, title: "Ground", text: "Claims are matched against curated government, health, financial, and education sources." },
  { icon: FileSearch, title: "Compare", text: "Evidence is classified as supporting, contradicting, or neutral with relevance and freshness signals." },
  { icon: ShieldCheck, title: "Decide", text: "A deterministic engine calculates verdicts, confidence, limitations, and citizen-readable explanations." },
];

const channels = [
  ["WhatsApp desks", "Verify viral forwards before they spread across a block or district."],
  ["CSC kiosks", "Give operators a fast claim check with printable evidence notes."],
  ["Field teams", "Sync offline reports from ASHA, panchayat, NGO, and campaign workers."],
  ["Command rooms", "Track misinformation categories, source gaps, and escalation patterns."],
];

export default function Home() {
  const { language, setLanguage, t } = useLanguage();
  const connectivity = useOnlineStatus();
  const { pendingCount, enqueue, isSyncing } = useSyncQueue();
  const recorder = useVoiceRecorder();

  const [claim, setClaim] = useState(fallbackClaims[0]);
  const [demoClaims, setDemoClaims] = useState<string[]>(fallbackClaims);
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [sources, setSources] = useState<SourceOut[]>([]);
  const [apiOnline, setApiOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [dataSaver, setDataSaver] = useState(false);
  const [installedPackIds, setInstalledPackIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    getDemoClaims()
      .then((data) => {
        const claims = data.map((item) => item.claim).filter(Boolean);
        if (claims.length) setDemoClaims(claims.slice(0, 4));
      })
      .catch(() => setDemoClaims(fallbackClaims));

    getHealth()
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false));

    getSources()
      .then((data) => {
        setSources(data);
        cacheSources(data).catch(() => {});
      })
      .catch(() => setSources([]));

    getSetting("dataSaver", false).then(setDataSaver).catch(() => {});
    getSetting<string[]>("installedOfflinePacks", []).then(setInstalledPackIds).catch(() => {});
  }, []);

  useEffect(() => {
    setSetting("dataSaver", dataSaver).catch(() => {});
  }, [dataSaver]);

  const verdict = useMemo(() => {
    if (!result) return null;
    return verdictStyles[result.verdict] ?? verdictStyles.UNVERIFIED;
  }, [result]);

  async function runVerification(input: string) {
    const claimText = input.trim();
    if (claimText.length < 3) return null;
    setError("");
    setNotice("");

    if (connectivity === "offline") {
      const cached = await getCachedVerification(claimText);
      if (cached) {
        // Never present cached data as live — the spec is explicit about this.
        setResult({ ...cached.result, offline: true });
        setNotice(t("offline.lastUpdate", { date: new Date(cached.cachedAt).toLocaleString() }));
        return { ...cached.result, offline: true };
      } else {
        const packResult = matchOfflinePack(claimText, installedPackIds, language);
        if (packResult) {
          setResult(packResult);
          setNotice("Verified on this device with a downloaded trust pack. Check the saved update date before acting.");
          cacheVerification(claimText, language, packResult).catch(() => {});
          return packResult;
        }
        await enqueue(claimText, language);
        setResult(null);
        setNotice(t("offline.queued"));
      }
      return null;
    }

    setIsLoading(true);
    try {
      const response = await verifyClaimRequest(claimText, language);
      setResult(response);
      setApiOnline(true);
      cacheVerification(claimText, language, response).catch(() => {});
      return response;
    } catch (err) {
      setApiOnline(false);
      const packResult = matchOfflinePack(claimText, installedPackIds, language);
      if (packResult) {
        setResult(packResult);
        setNotice("The live service is unavailable, so SatyaSetu used a downloaded trust pack and marked the result offline.");
        cacheVerification(claimText, language, packResult).catch(() => {});
        return packResult;
      } else {
        setError(err instanceof Error ? err.message : t("errors.aiUnavailable"));
        return null;
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function verifyClaim() {
    await runVerification(claim);
  }

  async function verifyForwardedClaim(text: string) {
    setClaim(text);
    return runVerification(text);
  }

  function toggleOfflinePack(packId: string) {
    setInstalledPackIds((current) => {
      const next = current.includes(packId) ? current.filter((id) => id !== packId) : [...current, packId];
      setSetting("installedOfflinePacks", next).catch(() => {});
      return next;
    });
  }

  async function verifyScreenshot(file: File) {
    setIsLoading(true);
    setError("");
    setNotice(t("verify.compressing"));
    try {
      const optimized = await compressImage(file);
      setNotice(`Reading ${optimized.name} with backend OCR...`);
      const response = await verifyImage(optimized);
      setResult(response);
      setClaim(response.claim);
      setApiOnline(true);
      setNotice("Screenshot read and verified.");
      cacheVerification(response.claim, language, response).catch(() => {});
    } catch (err) {
      setApiOnline(false);
      setError(err instanceof Error ? err.message : t("errors.ocrUnavailable"));
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleRecording() {
    setError("");
    if (recorder.state === "recording") {
      const blob = await recorder.stop();
      if (!blob) return;
      setIsTranscribing(true);
      setNotice(t("verify.listening"));
      try {
        const transcription = await speechToText(blob, language);
        setClaim(transcription.text);
        setNotice("");
      } catch (err) {
        setError(err instanceof Error ? err.message : t("errors.voiceUnavailable"));
      } finally {
        setIsTranscribing(false);
      }
      return;
    }
    await recorder.start();
    if (recorder.error) setError(recorder.error);
  }

  async function playExplanation(text: string) {
    setError("");
    if (isSpeaking) {
      audioRef.current?.pause();
      setIsSpeaking(false);
      return;
    }
    try {
      const speech = await textToSpeech(text, language);
      if (audioRef.current) {
        audioRef.current.src = `data:${speech.mime_type};base64,${speech.audio_base64}`;
        audioRef.current.onended = () => setIsSpeaking(false);
        await audioRef.current.play();
        setIsSpeaking(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.voiceUnavailable"));
    }
  }

  async function reportClaim() {
    if (claim.trim().length < 3) return;
    setIsReporting(true);
    setError("");
    setNotice("");
    try {
      const response = await submitReport(claim.trim());
      setNotice(`${response.message} Total reports for this claim: ${response.total_reports_for_claim}.`);
      setApiOnline(true);
    } catch (err) {
      setApiOnline(false);
      setError(err instanceof Error ? err.message : "Could not submit report.");
    } finally {
      setIsReporting(false);
    }
  }

  return (
    <main className="premium-shell">
      <header className="premium-nav">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-4 py-4 sm:px-6 lg:px-8">
          <a className="flex items-center gap-3" href="#top" aria-label="SatyaSetu home">
            <div className="brand-orbit"><ShieldCheck size={21} /></div>
            <div>
              <div className="text-base font-black text-white">SatyaSetu</div>
              <div className="text-xs font-bold text-cyan-100/75">National trust infrastructure</div>
            </div>
          </a>
          <nav className="hidden items-center gap-7 text-sm font-bold text-cyan-50/78 lg:flex">
            <a href="#platform">Platform</a>
            <a href="#flows">Flows</a>
            <a href="#governance">Governance</a>
            <a href="#demo">Live demo</a>
          </nav>
          <div className="flex items-center gap-3">
            <ConnectivityIndicator connectivity={connectivity} t={t} pendingCount={pendingCount} isSyncing={isSyncing} />
            <a className="nav-cta" href="#demo"><Play size={15} /> Run demo</a>
          </div>
        </div>
      </header>

      <section id="top" className="hero-stage">
        <div className="hero-mesh" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-14 pt-10 sm:px-6 lg:px-8 lg:pb-20 lg:pt-16">
          <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
            <div className="mb-5 flex flex-wrap gap-2">
              <span className="premium-pill"><Landmark size={14} /> GovTech verification OS</span>
              <span className="premium-pill"><Radio size={14} /> Built for crisis velocity</span>
            </div>
            <h1 className="hero-title">Evidence-grade public trust, built for the next 100 million citizens.</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
              SatyaSetu gives governments, banks, NGOs, and civic command centers a multilingual verification layer for viral claims, scheme confusion, fraud messages, and health misinformation.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a className="hero-primary" href="#demo">Verify a claim <ArrowRight size={18} /></a>
              <a className="hero-secondary" href="#flows">View response flows <ChevronRight size={18} /></a>
            </div>
          </div>

          <div className="mx-auto mt-10 max-w-5xl">
            <WinnerFeatures
              claim={claim}
              result={result}
              installedPackIds={installedPackIds}
              isLoading={isLoading}
              recorderState={recorder.state}
              onVerifyForward={verifyForwardedClaim}
              onPickScreenshot={() => fileInputRef.current?.click()}
              onToggleRecording={toggleRecording}
              onTogglePack={toggleOfflinePack}
            />
          </div>

          <div className="mx-auto mt-5 max-w-5xl">
            <VerificationChat
              claim={claim}
              setClaim={setClaim}
              language={language}
              setLanguage={setLanguage}
              result={result}
              verdict={verdict}
              sources={sources}
              apiOnline={apiOnline}
              isLoading={isLoading}
              isReporting={isReporting}
              error={error}
              notice={notice}
              verifyClaim={verifyClaim}
              reportClaim={reportClaim}
              fileInputRef={fileInputRef}
              verifyScreenshot={verifyScreenshot}
              demoClaims={demoClaims}
              t={t}
              connectivity={connectivity}
              pendingCount={pendingCount}
              recorderState={recorder.state}
              isTranscribing={isTranscribing}
              isSpeaking={isSpeaking}
              toggleRecording={toggleRecording}
              playExplanation={playExplanation}
              dataSaver={dataSaver}
              setDataSaver={setDataSaver}
            />
            <audio ref={audioRef} className="hidden" aria-hidden="true" />
          </div>

          <div className="mx-auto mt-8 max-w-5xl">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {operatingStats.map(([value, label]) => (
                <div className="glass-stat" key={label}>
                  <div className="text-2xl font-black text-white">{value}</div>
                  <div className="mt-1 text-xs font-bold leading-4 text-slate-300">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="brand-strip">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 py-5 sm:px-6 md:grid-cols-4 lg:px-8">
          {["District administration", "Public health teams", "Financial safety cells", "Rural service networks"].map((item) => (
            <div className="brand-chip" key={item}>{item}</div>
          ))}
        </div>
      </section>

      <section id="platform" className="section-wrap">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="Platform" title="A serious verification stack, not a chatbot wrapper." text="Every screen is built around auditability: source lineage, confidence logic, freshness, limitations, and human escalation." />
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            <Capability icon={Fingerprint} title="Deterministic verdict engine" text="LLMs can classify evidence, but fixed policy rules decide verified, contradicted, or unverified outcomes." />
            <Capability icon={Languages} title="Multilingual citizen layer" text="Field teams can move between typed, spoken, translated, and simplified outputs without changing the evidence record." />
            <Capability icon={LockKeyhole} title="Privacy-first operations" text="Screenshots are processed in memory, keys stay server-side, and reports never override source-backed truth." />
          </div>
        </div>
      </section>

      <section id="flows" className="section-wrap surface-band">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="Operating flows" title="From rumor intake to command-center intelligence." text="The product is designed for institutions that need reliable workflows across phones, kiosks, and district dashboards." />
          <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="flow-stack">
              {flowSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div className="flow-row" key={step.title}>
                    <div className="flow-index">{String(index + 1).padStart(2, "0")}</div>
                    <div className="flow-icon"><Icon size={20} /></div>
                    <div>
                      <h3 className="text-base font-black text-slate-950">{step.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{step.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="ops-board">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <div className="text-sm font-black text-slate-950">Misinformation operations</div>
                  <div className="text-xs font-bold text-slate-500">District view · live categories</div>
                </div>
                <span className="board-live"><Zap size={14} /> Active</span>
              </div>
              <div className="grid gap-4 p-5 md:grid-cols-2">
                {channels.map(([title, text]) => (
                  <div className="ops-card" key={title}>
                    <div className="text-sm font-black text-slate-950">{title}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-200 p-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <MiniSignal icon={Users} label="Field reporters" value="2,410" />
                  <MiniSignal icon={BarChart3} label="Claims triaged" value="18.6k" />
                  <MiniSignal icon={PhoneCall} label="Citizen assists" value="94%" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="governance" className="section-wrap">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <p className="section-eyebrow">Governance layer</p>
            <h2 className="section-title">Designed for buyers who ask hard questions.</h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              High-stakes public communication cannot depend on opaque answer generation. SatyaSetu exposes the operational record behind every verdict.
            </p>
          </div>
          <div className="governance-grid">
            <GovernanceItem title="Source registry" text="Curated domains with category, authority, freshness, and retrieval metadata." />
            <GovernanceItem title="Explainable confidence" text="Confidence comes from evidence quality and policy logic, not model bravado." />
            <GovernanceItem title="Human escalation" text="Unverified and high-impact claims can route to moderators or official communication cells." />
            <GovernanceItem title="Deployment control" text="Runs locally for demos, with a clean path to cloud, VPC, or government data-center hosting." />
          </div>
        </div>
      </section>

      <section id="demo" className="section-wrap demo-band">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="Live product" title="Run the verification flow." text="Use a seeded claim or paste your own. The landing page keeps selling while the product proves the core loop." />
          <div className="mt-10 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
            <section className="demo-panel">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-black text-slate-950">Claim intake</h3>
                <select className="select" value={language} onChange={(event) => setLanguage(event.target.value as LanguageCode)} aria-label="Language">
                  {languages.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <textarea className="textarea mt-4" value={claim} onChange={(event) => setClaim(event.target.value)} placeholder={t("verify.placeholder")} />
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button className="hero-primary hero-primary-light" onClick={verifyClaim} disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                  {t("verify.button")}
                </button>
                <div className="flex gap-2">
                  <button
                    className={`icon-button ${recorder.state === "recording" ? "icon-button-active" : ""}`}
                    aria-label={t("verify.startRecording")}
                    onClick={toggleRecording}
                    disabled={isTranscribing}
                  >
                    {isTranscribing ? <Loader2 className="animate-spin" size={18} /> : <Mic size={18} />}
                  </button>
                  <button className="icon-button" aria-label="Cloud sync"><Cloud size={18} /></button>
                </div>
              </div>
              {error ? <div className="error-strip"><AlertCircle size={18} /> {error}</div> : null}
              {notice ? <div className="error-strip notice-strip"><CheckCircle2 size={18} /> {notice}</div> : null}
              <div className="mt-5 grid gap-2">
                {demoClaims.map((item) => <button className="demo-chip" key={item} onClick={() => setClaim(item)}>{item}</button>)}
              </div>
            </section>
            <section className={`demo-panel ${verdict?.className ?? ""}`}>
              {result && verdict ? (
                <ResultPanel result={result} verdict={verdict} t={t} isSpeaking={isSpeaking} playExplanation={playExplanation} />
              ) : (
                <EmptyResult />
              )}
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

function HeroConsole({ result, verdict }: { result: VerifyResponse | null; verdict: { label: string; color: string } | null }) {
  return (
    <div className="hero-console">
      <div className="console-top">
        <div className="flex items-center gap-2"><span className="dot bg-rose-400" /><span className="dot bg-amber-300" /><span className="dot bg-emerald-400" /></div>
        <span className="text-xs font-black text-slate-400">SATYASETU COMMAND</span>
      </div>
      <div className="p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div><div className="text-xs font-black uppercase text-cyan-300">Current verification</div><div className="mt-1 text-lg font-black text-white">Rural benefits claim</div></div>
          <span className="premium-pill premium-pill-dark"><Clock3 size={14} /> Live</span>
        </div>
        <div className="claim-window"><p>“PM-KISAN gives eligible farmer families Rs 6,000 per year in three installments.”</p></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <ConsoleTile label="Registry" value="Official" />
          <ConsoleTile label="Evidence" value={result ? String(result.evidence.length) : "3 matches"} />
          <ConsoleTile label="Verdict" value={verdict?.label ?? "Verified"} hot />
        </div>
        <div className="mt-5 space-y-3">
          {["pmkisan.gov.in", "pib.gov.in", "india.gov.in"].map((source, index) => (
            <div className="source-line" key={source}>
              <div className="flex items-center gap-3"><BadgeCheck size={17} className="text-emerald-300" /><span>{source}</span></div>
              <span>{92 - index * 7}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VerificationChat({
  claim,
  setClaim,
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
  verifyClaim,
  reportClaim,
  fileInputRef,
  verifyScreenshot,
  demoClaims,
  t,
  connectivity,
  pendingCount,
  recorderState,
  isTranscribing,
  isSpeaking,
  toggleRecording,
  playExplanation,
  dataSaver,
  setDataSaver,
}: {
  claim: string;
  setClaim: (value: string) => void;
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
  verifyClaim: () => void;
  reportClaim: () => void;
  fileInputRef: RefObject<HTMLInputElement>;
  verifyScreenshot: (file: File) => void;
  demoClaims: string[];
  t: (key: string, vars?: Record<string, string | number>) => string;
  connectivity: "online" | "weak" | "offline";
  pendingCount: number;
  recorderState: "idle" | "recording" | "processing";
  isTranscribing: boolean;
  isSpeaking: boolean;
  toggleRecording: () => void;
  playExplanation: (text: string) => void;
  dataSaver: boolean;
  setDataSaver: (value: boolean) => void;
}) {
  return (
    <section className="chat-shell" aria-label="SatyaSetu verification chat">
      <div className="chat-sidebar">
        <div>
          <div className="text-xs font-black uppercase text-cyan-200/80">Workspace</div>
          <h2 className="mt-2 text-xl font-black text-white">Citizen Trust Desk</h2>
        </div>
        <div className="chat-tool-list">
          <ChatTool icon={FileSearch} label="Verify claim" active onClick={verifyClaim} />
          <ChatTool icon={Upload} label="Read screenshot" onClick={() => fileInputRef.current?.click()} />
          <ChatTool
            icon={Mic}
            label={recorderState === "recording" ? t("verify.listening") : t("home.speak")}
            active={recorderState === "recording"}
            onClick={toggleRecording}
          />
          <ChatTool icon={Languages} label="Translate reply" />
          <ChatTool icon={Cloud} label={`${t("dashboard.syncNow")}${pendingCount ? ` (${pendingCount})` : ""}`} />
        </div>
        <div className="sidebar-card">
            <div className="text-sm font-black text-white">{apiOnline ? "Backend connected" : "Backend offline"}</div>
            <p className="mt-2 text-xs leading-5 text-slate-300">
              {sources.length ? `${sources.length} trusted sources loaded from FastAPI.` : "Start FastAPI on port 8001 for live evidence."}
            </p>
            {connectivity !== "online" ? (
              <p className="mt-2 text-xs leading-5 text-amber-300">{t(`connectivity.${connectivity}`)}</p>
            ) : null}
            {pendingCount > 0 ? (
              <p className="mt-2 text-xs leading-5 text-cyan-200">{pendingCount} queued for sync</p>
            ) : null}
          </div>
          <label className="sidebar-toggle">
            <span>{t("dashboard.dataSaver")}</span>
            <input type="checkbox" checked={dataSaver} onChange={(event) => setDataSaver(event.target.checked)} />
          </label>
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
              {connectivity === "offline" ? t("connectivity.offline") : apiOnline ? "API live" : "API offline"}
            </span>
          </div>
        </div>

        <div className="chat-body">
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

          <div className="user-message">
            <div className="message-card user-card">
              <p>{claim}</p>
            </div>
            <div className="avatar user-avatar">You</div>
          </div>

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
                <h3 className="text-lg font-black text-slate-950">{result.summary}</h3>
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

        <div className="prompt-row">
          {demoClaims.slice(0, 3).map((item) => (
            <button className="prompt-pill" key={item} onClick={() => setClaim(item)}>{item}</button>
          ))}
        </div>

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
          <textarea value={claim} onChange={(event) => setClaim(event.target.value)} placeholder={t("verify.placeholder")} />
          <button className="send-button" onClick={verifyClaim} disabled={isLoading} aria-label="Send claim">
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          </button>
        </div>
        <div className="chat-footer-actions">
          <button onClick={reportClaim} disabled={isReporting || isLoading}>
            {isReporting ? <Loader2 className="animate-spin" size={15} /> : <AlertCircle size={15} />}
            {t("report.suspicious")}
          </button>
          <span>{sources.length ? `${sources.length} sources synced` : "Sources load when backend is online"}</span>
        </div>
      </div>
    </section>
  );
}

function ConnectivityIndicator({
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
  const Icon = connectivity === "offline" ? WifiOff : Wifi;
  const dotClass = connectivity === "online" ? "conn-dot-online" : connectivity === "weak" ? "conn-dot-weak" : "conn-dot-offline";
  return (
    <div className="connectivity-indicator" title={t(`connectivity.${connectivity}`)}>
      <span className={`conn-dot ${dotClass}`} />
      <Icon size={13} />
      <span className="hidden sm:inline">{t(`connectivity.${connectivity}`)}</span>
      {pendingCount > 0 ? (
        <span className="conn-pending">{isSyncing ? <Loader2 className="animate-spin" size={11} /> : pendingCount}</span>
      ) : null}
    </div>
  );
}

function ChatTool({ icon: Icon, label, active = false, onClick }: { icon: LucideIcon; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button className={`chat-tool ${active ? "chat-tool-active" : ""}`} onClick={onClick}>
      <Icon size={17} />
      {label}
    </button>
  );
}

function SectionHeader({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="max-w-3xl">
      <p className="section-eyebrow">{eyebrow}</p>
      <h2 className="section-title">{title}</h2>
      <p className="mt-4 text-base leading-8 text-slate-600">{text}</p>
    </div>
  );
}

function Capability({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <article className="capability-card">
      <div className="capability-icon"><Icon size={22} /></div>
      <h3 className="mt-5 text-lg font-black text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
    </article>
  );
}

function ConsoleTile({ label, value, hot = false }: { label: string; value: string; hot?: boolean }) {
  return (
    <div className="console-tile">
      <div className="text-xs font-bold text-slate-400">{label}</div>
      <div className={`mt-1 truncate text-sm font-black ${hot ? "text-emerald-300" : "text-white"}`}>{value}</div>
    </div>
  );
}

function MiniSignal({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="mini-signal">
      <Icon size={18} className="text-teal-700" />
      <div><div className="text-sm font-black text-slate-950">{value}</div><div className="text-xs font-bold text-slate-500">{label}</div></div>
    </div>
  );
}

function GovernanceItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="governance-item">
      <CheckCircle2 size={19} className="text-teal-700" />
      <div><h3 className="font-black text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></div>
    </div>
  );
}

function EmptyResult() {
  return (
    <div className="flex min-h-[430px] flex-col justify-between">
      <div>
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-teal-50 text-teal-700"><ShieldCheck size={24} /></div>
        <h3 className="text-2xl font-black text-slate-950">Evidence room ready</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">Run a claim to generate a verdict, source list, confidence, and limitations.</p>
      </div>
      <div className="grid gap-3">
        {["Official-source retrieval", "Deterministic decisioning", "Citizen-readable explanation"].map((item) => (
          <div className="result-row" key={item}><CheckCircle2 size={18} className="text-teal-700" />{item}</div>
        ))}
      </div>
    </div>
  );
}

function ResultPanel({
  result,
  verdict,
  t,
  isSpeaking,
  playExplanation,
}: {
  result: VerifyResponse;
  verdict: { label: string; color: string };
  t: (key: string, vars?: Record<string, string | number>) => string;
  isSpeaking: boolean;
  playExplanation: (text: string) => void;
}) {
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <span className={`verdict-badge ${verdict.color}`}><BadgeCheck size={17} /> {verdict.label}</span>
        <div className="flex items-center gap-2">
          <button className="icon-button icon-button-inline" aria-label={t("verdict.listen")} onClick={() => playExplanation(result.explanation)}>
            {isSpeaking ? <SquareIcon size={14} /> : <Volume2 size={14} />}
          </button>
          <span className="status-pill"><Clock3 size={14} /> {new Date(result.checkedAt).toLocaleTimeString()}</span>
        </div>
      </div>
      <h3 className="text-2xl font-black text-slate-950">{result.summary}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-700">{result.explanation}</p>
      {result.verdict === "UNVERIFIED" ? (
        <p className="mt-2 text-xs font-bold text-amber-700">{t("verdict.doNotTreatAsConfirmed")}</p>
      ) : null}
      <dl className="mt-6 grid grid-cols-3 gap-2">
        <Fact label={t("verdict.confidence")} value={result.confidence} />
        <Fact label="Sources" value={String(result.sourceCount)} />
        <Fact label="Mode" value={result.offline ? "Offline" : "Live"} />
      </dl>
      {result.confidenceFactors?.length ? (
        <ul className="mt-4 grid gap-1">
          {result.confidenceFactors.map((factor) => (
            <li className="text-xs font-bold text-slate-500" key={factor}>{factor}</li>
          ))}
        </ul>
      ) : null}
      <div className="mt-5 grid gap-3">
        {result.evidence.slice(0, 3).map((item) => (
          <article className="evidence-card p-4" key={item.id}>
            <div className="flex flex-wrap gap-2"><span className="status-pill">{item.relationship}</span><span className="status-pill">{Math.round(item.relevance_score * 100)}% relevant</span></div>
            <h4 className="mt-3 text-sm font-black text-slate-950">{item.document_title}</h4>
            <p className="mt-2 text-sm leading-5 text-slate-600">{item.reason}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
              <span>{item.source_name}</span>
              <span>·</span>
              <span>{item.authority_level}</span>
              {item.document_url ? (
                <a className="text-teal-700 underline" href={item.document_url} target="_blank" rel="noopener noreferrer">
                  {t("verdict.viewSource")}
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>
      {result.howVerified?.length ? (
        <details className="mt-5 how-verified">
          <summary className="cursor-pointer text-sm font-black text-slate-950">{t("verdict.howVerified")}</summary>
          <ol className="mt-3 grid gap-2">
            {result.howVerified.map((step) => (
              <li className="text-xs leading-5 text-slate-600" key={step.step}>
                <span className="font-black text-slate-950">{step.label}.</span> {step.detail}
              </li>
            ))}
          </ol>
        </details>
      ) : null}
      {result.limitations?.length ? (
        <p className="mt-4 text-xs leading-5 text-amber-700">{result.limitations.join(" ")}</p>
      ) : null}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <dt className="text-xs font-bold text-slate-500">{label}</dt>
      <dd className="mt-1 truncate text-sm font-black text-slate-950">{value}</dd>
    </div>
  );
}
