"use client";

import { BadgeCheck, CheckCircle2, Clock3, ShieldCheck, SquareIcon, Volume2 } from "lucide-react";

import type { VerifyResponse } from "@/services/api";
import { resultHeading } from "@/lib/resultCopy";

export function EmptyResult() {
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

export function ResultPanel({
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
      <h3 className="text-2xl font-black text-slate-950">{resultHeading(result)}</h3>
      <p className="mt-2 text-xs font-bold text-slate-500">Checked: {result.claim}</p>
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
