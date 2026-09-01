"use client";

import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  Clock3,
  Cloud,
  Database,
  FileSearch,
  Fingerprint,
  Landmark,
  Languages,
  Loader2,
  LockKeyhole,
  Mic,
  PhoneCall,
  ScanText,
  ShieldCheck,
  Sparkles,
  SquareIcon,
  Users,
  Volume2,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";
import type { LanguageCode } from "@/lib/i18n";
import type { VerifyResponse } from "@/services/api";
import { WinnerFeatures } from "@/components/WinnerFeatures";
import { ConnectivityIndicator } from "@/components/ConnectivityIndicator";
import { useAssistantState } from "@/hooks/useAssistantState";

const languages = SUPPORTED_LANGUAGES.map(({ code, label }) => [code, label] as [string, string]);

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
  const router = useRouter();
  const {
    language,
    setLanguage,
    t,
    connectivity,
    pendingCount,
    isSyncing,
    recorder,
    claim,
    setClaim,
    demoClaims,
    result,
    isLoading,
    isTranscribing,
    isSpeaking,
    installedPackIds,
    dialog,
    setDialog,
    error,
    notice,
    fileInputRef,
    audioRef,
    verdict,
    verifyClaim,
    verifyForwardedClaim,
    toggleOfflinePack,
    verifyScreenshot,
    toggleRecording,
    playExplanation,
  } = useAssistantState();

  const [showLaunchpad, setShowLaunchpad] = useState(false);

  useEffect(() => {
    if (showLaunchpad) {
      document.getElementById("launchpad")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showLaunchpad]);

  function revealLaunchpad() {
    setDialog(null);
    if (showLaunchpad) {
      document.getElementById("launchpad")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      setShowLaunchpad(true);
    }
  }

  function openAssistant() {
    router.push("/assistant");
  }

  function openEvidenceReceipt() {
    if (result) {
      setDialog("receipt");
    } else {
      openAssistant();
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
            <button type="button" className="nav-link" onClick={() => setDialog("forward")}>WhatsApp</button>
            <button type="button" className="nav-link" onClick={() => setDialog("ivr")}>Voice Agent</button>
            <button type="button" className="nav-link" onClick={openAssistant}>AI Assistant</button>
            <button type="button" className="nav-link" onClick={openEvidenceReceipt}>Evidence Receipt</button>
          </nav>
          <div className="flex items-center gap-3">
            <ConnectivityIndicator connectivity={connectivity} t={t} pendingCount={pendingCount} isSyncing={isSyncing} />
          </div>
        </div>
      </header>

      <section id="top" className="hero-stage">
        <div className="hero-mesh" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-6 pt-5 sm:px-6 sm:pb-14 sm:pt-10 lg:px-8 lg:pb-20 lg:pt-16">
          <div className="hero-split">
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              <span className="premium-pill hero-kicker"><Landmark size={14} /> Government Scheme Verification</span>
              <h1 className="hero-title hero-title-scheme">
                Verify Any Government Scheme.<br />Trust the Official Source.
              </h1>
              <p className="hero-subheadline">
                Check government scheme messages, eligibility claims, benefits, deadlines, and
                application information against verified official sources.
              </p>
              <div className="hero-trust-row lg:justify-start">
                <span><Landmark size={14} /> Government schemes</span>
                <span><ShieldCheck size={14} /> Official sources</span>
                <span><Fingerprint size={14} /> Evidence-backed</span>
                <span><Mic size={14} /> Voice + regional languages</span>
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:mt-6 sm:flex-row">
                <button type="button" className="hero-primary" onClick={revealLaunchpad}>Verify a Scheme <ArrowRight size={18} /></button>
              </div>
            </div>

            <HeroExample />
          </div>

          <div id="launchpad" className={showLaunchpad ? "mx-auto mt-10 max-w-5xl scroll-mt-24" : "scroll-mt-24"}>
          {showLaunchpad ? (
            <>
              <p className="hero-access-heading">One government-scheme verification service — however you reach it:</p>
              <div className="mx-auto mt-3 max-w-5xl">
                <WinnerFeatures
                  claim={claim}
                  result={result}
                  installedPackIds={installedPackIds}
                  isLoading={isLoading}
                  recorderState={recorder.state}
                  dialog={dialog}
                  setDialog={setDialog}
                  onVerifyForward={verifyForwardedClaim}
                  onPickScreenshot={() => fileInputRef.current?.click()}
                  onToggleRecording={toggleRecording}
                  onTogglePack={toggleOfflinePack}
                  onOpenAssistant={openAssistant}
                />
              </div>
            </>
          ) : null}
          </div>
          <audio ref={audioRef} className="hidden" aria-hidden="true" />
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

function HeroExample() {
  return (
    <div className="hero-example">
      <div className="hero-example-top">
        <span className="hero-example-label">Example verification</span>
        <span className="hero-example-verdict"><BadgeCheck size={16} /> VERIFIED</span>
      </div>
      <p className="hero-example-claim">
        "PM-KISAN is giving ₹6,000 to every eligible farmer family. Is this true?"
      </p>
      <p className="hero-example-explanation">
        Official source confirms: PM-KISAN gives eligible small and marginal farmer families
        ₹6,000 per year — matching the claim.
      </p>
      <div className="hero-example-source">
        <ShieldCheck size={15} />
        <span>PM-KISAN — Ministry of Agriculture &amp; Farmers Welfare <em>(pmkisan.gov.in)</em></span>
      </div>
    </div>
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
