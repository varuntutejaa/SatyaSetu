"use client";

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
import { useLanguage } from "@/lib/i18n";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useSyncQueue } from "@/hooks/useSyncQueue";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { compressImage } from "@/lib/imageCompress";
import { cacheSources, cacheVerification, getCachedVerification, getSetting, setSetting } from "@/lib/db";
import { matchOfflinePack } from "@/lib/offlinePacks";
import type { FeatureDialog } from "@/components/WinnerFeatures";

const fallbackClaims = [
  "PM-KISAN gives eligible farmer families Rs 6,000 per year in three installments.",
  "RBI asks citizens to share OTPs with bank officials for account verification.",
  "Aadhaar is mandatory for every school admission in India.",
  "Report cyber fraud quickly through the national cybercrime portal or helpline 1930.",
];

const verdictStyles: Record<string, { label: string; className: string; color: string }> = {
  VERIFIED: { label: "Verified", className: "verdict-verified", color: "text-emerald-700" },
  CONTRADICTED: { label: "Contradicted", className: "verdict-contradicted", color: "text-rose-700" },
  UNVERIFIED: { label: "Needs Evidence", className: "verdict-unverified", color: "text-amber-700" },
};

export function useAssistantState() {
  const { language, setLanguage, t } = useLanguage();
  const connectivity = useOnlineStatus();
  const { pendingCount, enqueue, isSyncing } = useSyncQueue();
  const recorder = useVoiceRecorder();

  const [claim, setClaim] = useState(fallbackClaims[0]);
  const [sentClaim, setSentClaim] = useState(fallbackClaims[0]);
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
  const [dialog, setDialog] = useState<FeatureDialog>(null);
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
    setSentClaim(claimText);
    setClaim("");

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
      setSentClaim(response.claim);
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

  return {
    language,
    setLanguage,
    t,
    connectivity,
    pendingCount,
    isSyncing,
    recorder,
    claim,
    setClaim,
    sentClaim,
    demoClaims,
    result,
    sources,
    apiOnline,
    isLoading,
    isReporting,
    isTranscribing,
    isSpeaking,
    dataSaver,
    setDataSaver,
    installedPackIds,
    dialog,
    setDialog,
    error,
    notice,
    fileInputRef: fileInputRef as RefObject<HTMLInputElement>,
    audioRef,
    verdict,
    verifyClaim,
    verifyForwardedClaim,
    toggleOfflinePack,
    verifyScreenshot,
    toggleRecording,
    playExplanation,
    reportClaim,
  };
}
