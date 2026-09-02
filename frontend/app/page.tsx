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
import { useEffect, useState } from "react";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";
import type { LanguageCode } from "@/lib/i18n";
import { WinnerFeatures } from "@/components/WinnerFeatures";
import { TopNav } from "@/components/TopNav";
import { EmptyResult, ResultPanel } from "@/components/ResultPanel";
import { useAssistantState } from "@/hooks/useAssistantState";

const languages = SUPPORTED_LANGUAGES.map(({ code, label }) => [code, label] as [string, string]);

const flowSteps = [
  { icon: ScanText, title: "Send A Claim", text: "Share a message, screenshot, or voice note." },
  { icon: Database, title: "Check Proof", text: "We look for the right official information." },
  { icon: FileSearch, title: "Compare Details", text: "Benefits, dates, links, and conditions are checked." },
  { icon: ShieldCheck, title: "Get An Answer", text: "See what is true, what is unclear, and where to read more." },
];

const channels = [
  ["WhatsApp", "Check forwarded messages."],
  ["Kiosk", "Help citizens at service centers."],
  ["Field Teams", "Use voice during outreach."],
  ["Dashboard", "Track common questions."],
];

export default function Home() {
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
    error,
    notice,
    audioRef,
    verdict,
    verifyClaim,
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
    if (showLaunchpad) {
      document.getElementById("launchpad")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      setShowLaunchpad(true);
    }
  }

  return (
    <main className="premium-shell">
      <TopNav connectivity={connectivity} t={t} pendingCount={pendingCount} isSyncing={isSyncing} />

      <section id="top" className="hero-stage">
        <div className="hero-mesh" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-6 pt-5 sm:px-6 sm:pb-14 sm:pt-10 lg:px-8 lg:pb-20 lg:pt-16">
          <div className="hero-split">
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              <span className="premium-pill hero-kicker"><Landmark size={14} /> Official Scheme Help</span>
              <h1 className="hero-title hero-title-scheme">
                Know What Is Real.<br />Before You Act.
              </h1>
              <p className="hero-subheadline">
                Check scheme benefits, eligibility, deadlines, and fraud messages in simple language with official proof.
              </p>
              <div className="hero-trust-row lg:justify-start">
                <span><Landmark size={14} /> Schemes</span>
                <span><ShieldCheck size={14} /> Official proof</span>
                <span><Fingerprint size={14} /> Clear answer</span>
                <span><Mic size={14} /> Speak your question</span>
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:mt-6 sm:flex-row">
                <button type="button" className="hero-primary" onClick={revealLaunchpad}>Start Verification <ArrowRight size={18} /></button>
              </div>
            </div>

            <HeroExample />
          </div>

          <div id="launchpad" className={showLaunchpad ? "mx-auto mt-10 max-w-5xl scroll-mt-24" : "scroll-mt-24"}>
          {showLaunchpad ? (
            <>
              <p className="hero-access-heading">Choose how you want to check:</p>
              <div className="mx-auto mt-3 max-w-5xl">
                <WinnerFeatures />
              </div>
            </>
          ) : null}
          </div>
          <audio ref={audioRef} className="hidden" aria-hidden="true" />
        </div>
      </section>

      <section id="platform" className="section-wrap">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="Why Use It" title="Get a clear answer before you share or pay." text="Avoid fake links, false promises, and confusing scheme messages." />
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            <Capability icon={Fingerprint} title="No Guesswork" text="Answers are shown with proof, so you know why to trust them." />
            <Capability icon={Languages} title="Use Your Language" text="Type, speak, or listen in the language you are comfortable with." />
            <Capability icon={LockKeyhole} title="Safe To Use" text="Your uploads are handled carefully and only used to check the claim." />
          </div>
        </div>
      </section>

      <section id="flows" className="section-wrap surface-band">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="How It Works" title="Ask once. Get proof." text="The process is simple for citizens and useful for teams helping people on the ground." />
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
                  <div className="text-sm font-black text-slate-950">Common Questions</div>
                  <div className="text-xs font-bold text-slate-500">Messages, claims, and alerts</div>
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
            <p className="section-eyebrow">Trust</p>
            <h2 className="section-title">Made for important public information.</h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              People should not lose money, miss benefits, or share false messages because information is unclear.
            </p>
          </div>
          <div className="governance-grid">
            <GovernanceItem title="Official Links" text="Users can open the source and read the original information." />
            <GovernanceItem title="Simple Result" text="Every answer says verified, contradicted, or needs more evidence." />
            <GovernanceItem title="Review When Needed" text="Unclear or sensitive claims can be checked again by a person." />
            <GovernanceItem title="Works In The Field" text="Built for phones, kiosks, and teams helping citizens directly." />
          </div>
        </div>
      </section>

      <section id="demo" className="section-wrap demo-band">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="Try It" title="Check a claim now." text="Paste a message or choose an example. You will get a clear answer with proof." />
          <div className="mt-10 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
            <section className="demo-panel">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-black text-slate-950">Your Message</h3>
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
        <span className="hero-example-label">Example</span>
        <span className="hero-example-verdict"><BadgeCheck size={16} /> VERIFIED</span>
      </div>
      <p className="hero-example-claim">
        "PM-KISAN gives ₹6,000 to eligible farmer families. Is this true?"
      </p>
      <p className="hero-example-explanation">
        Yes. Official information confirms the benefit amount for eligible farmer families.
      </p>
      <div className="hero-example-source">
        <ShieldCheck size={15} />
        <span>PM-KISAN — Ministry of Agriculture &amp; Farmers Welfare <em>(pmkisan.gov.in)</em></span>
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
