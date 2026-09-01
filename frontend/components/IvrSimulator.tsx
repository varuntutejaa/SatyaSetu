"use client";

import { BadgeCheck, CheckCircle2, Delete, Languages, Loader2, Mic, PhoneCall, PhoneOff, RotateCcw, ShieldCheck, Volume2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { OFFLINE_PACKS } from "@/lib/offlinePacks";
import type { VerifyResponse } from "@/services/api";

type IvrLanguage =
  | "hi-IN"
  | "pa-IN"
  | "bn-IN"
  | "ta-IN"
  | "te-IN"
  | "gu-IN"
  | "kn-IN"
  | "ml-IN"
  | "mr-IN"
  | "od-IN"
  | "en-IN";
type IvrPhase = "language" | "claim" | "checking" | "result" | "ended";

const LANGUAGE_OPTIONS: Array<{ code: IvrLanguage; label: string; name: string }> = [
  { code: "hi-IN", label: "हिंदी", name: "Hindi" },
  { code: "pa-IN", label: "ਪੰਜਾਬੀ", name: "Punjabi" },
  { code: "bn-IN", label: "বাংলা", name: "Bengali" },
  { code: "ta-IN", label: "தமிழ்", name: "Tamil" },
  { code: "te-IN", label: "తెలుగు", name: "Telugu" },
  { code: "gu-IN", label: "ગુજરાતી", name: "Gujarati" },
  { code: "kn-IN", label: "ಕನ್ನಡ", name: "Kannada" },
  { code: "ml-IN", label: "മലയാളം", name: "Malayalam" },
  { code: "mr-IN", label: "मराठी", name: "Marathi" },
  { code: "od-IN", label: "ଓଡ଼ିଆ", name: "Odia" },
  { code: "en-IN", label: "English", name: "English" },
];

const COPY: Record<IvrLanguage, { welcome: string; prompt: string; input: string; checking: string; again: string }> = {
  "hi-IN": {
    welcome: "सत्यसेतु में आपका स्वागत है",
    prompt: "बीप के बाद वह संदेश बोलें जिसकी आप जाँच करना चाहते हैं।",
    input: "संदेश यहाँ लिखें या माइक दबाकर बोलें...",
    checking: "विश्वसनीय सरकारी स्रोतों की जाँच हो रही है...",
    again: "दूसरी जानकारी जाँचें",
  },
  "pa-IN": {
    welcome: "ਸਤਿਆਸੇਤੂ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ",
    prompt: "ਬੀਪ ਤੋਂ ਬਾਅਦ ਉਹ ਸੁਨੇਹਾ ਬੋਲੋ ਜਿਸਦੀ ਤੁਸੀਂ ਜਾਂਚ ਕਰਨੀ ਚਾਹੁੰਦੇ ਹੋ।",
    input: "ਸੁਨੇਹਾ ਇੱਥੇ ਲਿਖੋ ਜਾਂ ਮਾਈਕ ਦਬਾ ਕੇ ਬੋਲੋ...",
    checking: "ਭਰੋਸੇਯੋਗ ਸਰਕਾਰੀ ਸਰੋਤਾਂ ਦੀ ਜਾਂਚ ਕੀਤੀ ਜਾ ਰਹੀ ਹੈ...",
    again: "ਹੋਰ ਜਾਣਕਾਰੀ ਜਾਂਚੋ",
  },
  "bn-IN": {
    welcome: "সত্যসেতুতে আপনাকে স্বাগতম",
    prompt: "বিপের পরে যে বার্তাটি যাচাই করতে চান তা বলুন।",
    input: "বার্তা লিখুন বা মাইক চাপুন...",
    checking: "নির্ভরযোগ্য সরকারি উৎস যাচাই করা হচ্ছে...",
    again: "আরেকটি তথ্য যাচাই করুন",
  },
  "ta-IN": {
    welcome: "சத்யசேதுவிற்கு வரவேற்கிறோம்",
    prompt: "பீப்பிற்குப் பிறகு சரிபார்க்க வேண்டிய செய்தியைச் சொல்லுங்கள்.",
    input: "செய்தியை எழுதவும் அல்லது மைக் அழுத்தவும்...",
    checking: "நம்பகமான அரசுத் தகவல்கள் சரிபார்க்கப்படுகின்றன...",
    again: "மற்றொரு தகவலைச் சரிபார்க்கவும்",
  },
  "te-IN": {
    welcome: "సత్యసేతుకు స్వాగతం",
    prompt: "బీప్ తర్వాత మీరు ధృవీకరించాలనుకునే సందేశాన్ని చెప్పండి.",
    input: "సందేశాన్ని టైప్ చేయండి లేదా మైక్ నొక్కండి...",
    checking: "విశ్వసనీయ ప్రభుత్వ మూలాలు తనిఖీ అవుతున్నాయి...",
    again: "మరొక సమాచారాన్ని తనిఖీ చేయండి",
  },
  "gu-IN": {
    welcome: "સત્યસેતુમાં આપનું સ્વાગત છે",
    prompt: "બીપ પછી તમે ચકાસવા માંગતા સંદેશને બોલો.",
    input: "સંદેશ લખો અથવા માઇક દબાવો...",
    checking: "વિશ્વસનીય સરકારી સ્ત્રોતો તપાસવામાં આવી રહ્યા છે...",
    again: "બીજી માહિતી ચકાસો",
  },
  "kn-IN": {
    welcome: "ಸತ್ಯಸೇತುವಿಗೆ ಸ್ವಾಗತ",
    prompt: "ಬೀಪ್ ನಂತರ ನೀವು ಪರಿಶೀಲಿಸಲು ಬಯಸುವ ಸಂದೇಶವನ್ನು ಹೇಳಿ.",
    input: "ಸಂದೇಶವನ್ನು ಬರೆಯಿರಿ ಅಥವಾ ಮೈಕ್ ಒತ್ತಿರಿ...",
    checking: "ನಂಬಿಗಸ್ತ ಸರ್ಕಾರಿ ಮೂಲಗಳನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...",
    again: "ಮತ್ತೊಂದು ಮಾಹಿತಿ ಪರಿಶೀಲಿಸಿ",
  },
  "ml-IN": {
    welcome: "സത്യസേതുവിലേക്ക് സ്വാഗതം",
    prompt: "ബീപ്പിന് ശേഷം പരിശോധിക്കേണ്ട സന്ദേശം പറയുക.",
    input: "സന്ദേശം എഴുതുക അല്ലെങ്കിൽ മൈക്ക് അമർത്തുക...",
    checking: "വിശ്വസനീയമായ സർക്കാർ ഉറവിടങ്ങൾ പരിശോധിക്കുന്നു...",
    again: "മറ്റൊരു വിവരം പരിശോധിക്കുക",
  },
  "mr-IN": {
    welcome: "सत्यसेतूमध्ये आपले स्वागत आहे",
    prompt: "बीपनंतर तुम्हाला तपासायचा संदेश बोला.",
    input: "संदेश लिहा किंवा माइक दाबा...",
    checking: "विश्वासार्ह सरकारी स्रोत तपासले जात आहेत...",
    again: "दुसरी माहिती तपासा",
  },
  "od-IN": {
    welcome: "ସତ୍ୟସେତୁକୁ ସ୍ୱାଗତ",
    prompt: "ବୀପ୍ ପରେ ଆପଣ ଯାଞ୍ଚ କରିବାକୁ ଚାହୁଁଥିବା ସନ୍ଦେଶ କହନ୍ତୁ।",
    input: "ସନ୍ଦେଶ ଲେଖନ୍ତୁ କିମ୍ବା ମାଇକ୍ ଦବାନ୍ତୁ...",
    checking: "ବିଶ୍ୱସନୀୟ ସରକାରୀ ସ୍ରୋତ ଯାଞ୍ଚ ହେଉଛି...",
    again: "ଆଉ ଏକ ସୂଚନା ଯାଞ୍ଚ କରନ୍ତୁ",
  },
  "en-IN": {
    welcome: "Welcome to SatyaSetu",
    prompt: "After the beep, say the message you want to verify.",
    input: "Type the message here or tap the microphone...",
    checking: "Checking reliable official sources...",
    again: "Check another message",
  },
};

const SPOKEN_VERDICTS: Record<string, Record<string, string>> = {
  "hi-IN": {
    VERIFIED: "परिणाम। यह जानकारी सत्यापित है। विश्वसनीय सरकारी प्रमाण इसका समर्थन करता है।",
    CONTRADICTED: "चेतावनी। यह जानकारी विश्वसनीय सरकारी प्रमाण से मेल नहीं खाती। कृपया इसे आगे न भेजें।",
    UNVERIFIED: "पर्याप्त सरकारी प्रमाण नहीं मिला। इसे सही न मानें और आगे न भेजें।",
  },
  "en-IN": {
    VERIFIED: "Result. This information is verified. Reliable official evidence supports it.",
    CONTRADICTED: "Warning. This information conflicts with reliable official evidence. Please do not forward it.",
    UNVERIFIED: "There is not enough official evidence to confirm this information. Do not treat it as true or forward it.",
  },
  "pa-IN": {
    VERIFIED: "ਨਤੀਜਾ। ਇਹ ਜਾਣਕਾਰੀ ਤਸਦੀਕਸ਼ੁਦਾ ਹੈ। ਭਰੋਸੇਯੋਗ ਸਰਕਾਰੀ ਸਬੂਤ ਇਸਦੀ ਪੁਸ਼ਟੀ ਕਰਦਾ ਹੈ।",
    CONTRADICTED: "ਚੇਤਾਵਨੀ। ਇਹ ਜਾਣਕਾਰੀ ਭਰੋਸੇਯੋਗ ਸਰਕਾਰੀ ਸਬੂਤ ਨਾਲ ਮੇਲ ਨਹੀਂ ਖਾਂਦੀ। ਕਿਰਪਾ ਕਰਕੇ ਇਸਨੂੰ ਅੱਗੇ ਨਾ ਭੇਜੋ।",
    UNVERIFIED: "ਲੋੜੀਂਦਾ ਸਰਕਾਰੀ ਸਬੂਤ ਨਹੀਂ ਮਿਲਿਆ। ਇਸਨੂੰ ਸਹੀ ਨਾ ਮੰਨੋ ਅਤੇ ਅੱਗੇ ਨਾ ਭੇਜੋ।",
  },
  "bn-IN": {
    VERIFIED: "ফলাফল। এই তথ্য যাচাই করা হয়েছে। নির্ভরযোগ্য সরকারি প্রমাণ এটিকে সমর্থন করে।",
    CONTRADICTED: "সতর্কতা। এই তথ্য নির্ভরযোগ্য সরকারি প্রমাণের সঙ্গে মেলে না। অনুগ্রহ করে এটি ফরোয়ার্ড করবেন না।",
    UNVERIFIED: "যথেষ্ট সরকারি প্রমাণ পাওয়া যায়নি। এটিকে সত্য ধরে নেবেন না বা ফরোয়ার্ড করবেন না।",
  },
  "ta-IN": {
    VERIFIED: "முடிவு. இந்த தகவல் சரிபார்க்கப்பட்டது. நம்பகமான அரசுத் தகவல் இதை ஆதரிக்கிறது.",
    CONTRADICTED: "எச்சரிக்கை. இந்த தகவல் நம்பகமான அரசுத் தகவலுடன் பொருந்தவில்லை. இதை பகிர வேண்டாம்.",
    UNVERIFIED: "போதுமான அரசுச் சான்று கிடைக்கவில்லை. இதை உண்மை என்று கருத வேண்டாம், பகிரவும் வேண்டாம்.",
  },
  "te-IN": {
    VERIFIED: "ఫలితం. ఈ సమాచారం ధృవీకరించబడింది. విశ్వసనీయ ప్రభుత్వ ఆధారాలు దీనికి మద్దతు ఇస్తున్నాయి.",
    CONTRADICTED: "హెచ్చరిక. ఈ సమాచారం విశ్వసనీయ ప్రభుత్వ ఆధారాలతో సరిపోలడం లేదు. దీన్ని ముందుకు పంపవద్దు.",
    UNVERIFIED: "తగిన ప్రభుత్వ ఆధారాలు దొరకలేదు. దీన్ని నిజం అనుకోకండి, ముందుకు పంపవద్దు.",
  },
  "gu-IN": {
    VERIFIED: "પરિણામ. આ માહિતી ચકાસાયેલ છે. વિશ્વસનીય સરકારી પુરાવા તેને સમર્થન આપે છે.",
    CONTRADICTED: "ચેતવણી. આ માહિતી વિશ્વસનીય સરકારી પુરાવા સાથે મેળ ખાતી નથી. કૃપા કરીને તેને આગળ મોકલશો નહીં.",
    UNVERIFIED: "પૂરતા સરકારી પુરાવા મળ્યા નથી. તેને સાચી માનીને આગળ મોકલશો નહીં.",
  },
  "kn-IN": {
    VERIFIED: "ಫಲಿತಾಂಶ. ಈ ಮಾಹಿತಿ ಪರಿಶೀಲಿಸಲಾಗಿದೆ. ನಂಬಿಗಸ್ತ ಸರ್ಕಾರಿ ಸಾಕ್ಷ್ಯ ಇದನ್ನು ಬೆಂಬಲಿಸುತ್ತದೆ.",
    CONTRADICTED: "ಎಚ್ಚರಿಕೆ. ಈ ಮಾಹಿತಿ ನಂಬಿಗಸ್ತ ಸರ್ಕಾರಿ ಸಾಕ್ಷ್ಯಕ್ಕೆ ಹೊಂದಿಕೆಯಾಗುವುದಿಲ್ಲ. ದಯವಿಟ್ಟು ಇದನ್ನು ಹಂಚಬೇಡಿ.",
    UNVERIFIED: "ಸಾಕಷ್ಟು ಸರ್ಕಾರಿ ಸಾಕ್ಷ್ಯ ಸಿಕ್ಕಿಲ್ಲ. ಇದನ್ನು ಸತ್ಯವೆಂದು ನಂಬಬೇಡಿ ಅಥವಾ ಹಂಚಬೇಡಿ.",
  },
  "ml-IN": {
    VERIFIED: "ഫലം. ഈ വിവരം പരിശോധിച്ചുറപ്പിച്ചു. വിശ്വസനീയമായ സർക്കാർ തെളിവ് ഇതിനെ പിന്തുണയ്ക്കുന്നു.",
    CONTRADICTED: "മുന്നറിയിപ്പ്. ഈ വിവരം വിശ്വസനീയമായ സർക്കാർ തെളിവുമായി പൊരുത്തപ്പെടുന്നില്ല. ദയവായി ഇത് ഫോർവേഡ് ചെയ്യരുത്.",
    UNVERIFIED: "മതിയായ സർക്കാർ തെളിവ് കണ്ടെത്തിയില്ല. ഇതിനെ സത്യമായി കരുതരുത്, ഫോർവേഡ് ചെയ്യരുത്.",
  },
  "mr-IN": {
    VERIFIED: "निकाल. ही माहिती सत्यापित आहे. विश्वासार्ह सरकारी पुरावा याला समर्थन देतो.",
    CONTRADICTED: "इशारा. ही माहिती विश्वासार्ह सरकारी पुराव्याशी जुळत नाही. कृपया ती पुढे पाठवू नका.",
    UNVERIFIED: "पुरेसा सरकारी पुरावा सापडला नाही. ती खरी मानू नका किंवा पुढे पाठवू नका.",
  },
  "od-IN": {
    VERIFIED: "ଫଳାଫଳ। ଏହି ସୂଚନା ଯାଞ୍ଚିତ। ବିଶ୍ୱସନୀୟ ସରକାରୀ ପ୍ରମାଣ ଏହାକୁ ସମର୍ଥନ କରେ।",
    CONTRADICTED: "ସତର୍କ। ଏହି ସୂଚନା ବିଶ୍ୱସନୀୟ ସରକାରୀ ପ୍ରମାଣ ସହିତ ମେଳ ଖାଉନାହିଁ। ଏହାକୁ ଆଗକୁ ପଠାନ୍ତୁ ନାହିଁ।",
    UNVERIFIED: "ପର୍ଯ୍ୟାପ୍ତ ସରକାରୀ ପ୍ରମାଣ ମିଳିଲା ନାହିଁ। ଏହାକୁ ସତ୍ୟ ଭାବନ୍ତୁ ନାହିଁ କିମ୍ବା ଆଗକୁ ପଠାନ୍ତୁ ନାହିଁ।",
  },
};

const DEFAULT_VERDICTS = SPOKEN_VERDICTS["en-IN"];

export function IvrSimulator({
  open,
  onClose,
  claim,
  recorderState,
  onToggleRecording,
  onVerify,
}: {
  open: boolean;
  onClose: () => void;
  claim: string;
  recorderState: "idle" | "recording" | "processing";
  onToggleRecording: () => void;
  onVerify: (text: string) => Promise<VerifyResponse | null>;
}) {
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<IvrPhase>("language");
  const [language, setLanguage] = useState<IvrLanguage>("hi-IN");
  const [spokenClaim, setSpokenClaim] = useState(claim);
  const [callResult, setCallResult] = useState<VerifyResponse | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState("");
  const selectedCopy = COPY[language];
  const verdictCopy = SPOKEN_VERDICTS[language] ?? DEFAULT_VERDICTS;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setPhase("language");
    setCallResult(null);
    setDemoMode(false);
    setVoiceNotice("");
    setSpokenClaim(claim);
  }, [open, claim]);

  useEffect(() => {
    if (open && phase === "claim" && recorderState !== "recording") setSpokenClaim(claim);
  }, [claim, open, phase, recorderState]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const elapsed = useMemo(() => (phase === "language" ? "00:03" : phase === "ended" ? "Call ended" : "00:18"), [phase]);

  function selectLanguage(nextLanguage: IvrLanguage) {
    setLanguage(nextLanguage);
    setPhase("claim");
    setVoiceNotice(speak(COPY[nextLanguage].welcome, nextLanguage));
  }

  async function verifyInCall() {
    if (spokenClaim.trim().length < 3) return;
    setPhase("checking");
    const liveResult = await onVerify(spokenClaim);
    const nextResult = liveResult ?? createSafeDemoResult(spokenClaim, language);
    setCallResult(nextResult);
    setDemoMode(!liveResult);
    setPhase("result");
    setVoiceNotice(speak((SPOKEN_VERDICTS[language] ?? DEFAULT_VERDICTS)[nextResult.verdict] ?? DEFAULT_VERDICTS.UNVERIFIED, language));
  }

  function resetClaim() {
    window.speechSynthesis?.cancel();
    setCallResult(null);
    setSpokenClaim("");
    setDemoMode(false);
    setVoiceNotice("");
    setPhase("claim");
  }

  if (!open || !mounted) return null;

  return createPortal(
    <div className="ivr-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="ivr-phone" role="dialog" aria-modal="true" aria-labelledby="ivr-title">
        <div className="ivr-phone-top">
          <div className="ivr-call-identity">
            <span className="ivr-logo"><ShieldCheck size={22} /></span>
            <div><h2 id="ivr-title">SatyaSetu Helpline</h2><p>{elapsed} · Sarvam voice demo</p></div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close IVR simulator"><X size={19} /></button>
        </div>

        <div className="ivr-screen" aria-live="polite">
          {phase === "language" ? (
            <div className="ivr-language-screen">
              <span className="ivr-connected"><span /> Connected</span>
              <h3>Select language</h3>
              <p>Choose how SatyaSetu should speak to you</p>
              <div className="ivr-language-grid">
                {LANGUAGE_OPTIONS.map((option) => (
                  <button type="button" key={option.code} onClick={() => selectLanguage(option.code)} aria-label={`Choose ${option.name}`}>
                    <Languages size={17} />
                    <span><strong>{option.label}</strong><small>{option.name}</small></span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {phase === "claim" ? (
            <div className="ivr-claim-screen">
              <span className="ivr-step">VOICE STEP 2 OF 3</span>
              <h3>{selectedCopy.welcome}</h3>
              <p>{selectedCopy.prompt}</p>
              <div className={`ivr-wave ${recorderState === "recording" ? "ivr-wave-live" : ""}`} aria-hidden="true">
                {[18, 35, 27, 49, 23, 40, 30, 52, 24, 36, 19].map((height, index) => <span key={index} style={{ height }} />)}
              </div>
              <button type="button" className={`ivr-mic ${recorderState === "recording" ? "ivr-mic-live" : ""}`} onClick={onToggleRecording}>
                <Mic size={25} /> {recorderState === "recording" ? "Tap to stop" : "Tap to speak"}
              </button>
              <div className="ivr-or"><span />or type for this demo<span /></div>
              <textarea value={spokenClaim} onChange={(event) => setSpokenClaim(event.target.value)} placeholder={selectedCopy.input} />
              <button type="button" className="ivr-check-button" onClick={verifyInCall} disabled={spokenClaim.trim().length < 3}>
                <PhoneCall size={18} /> Verify on this call
              </button>
            </div>
          ) : null}

          {phase === "checking" ? (
            <div className="ivr-checking-screen">
              <div className="ivr-pulse"><Loader2 className="animate-spin" size={30} /></div>
              <h3>{selectedCopy.checking}</h3>
              <div className="ivr-check-list">
                <span><CheckCircle2 size={16} /> Speech captured</span>
                <span><Loader2 className="animate-spin" size={16} /> Comparing official evidence</span>
              </div>
            </div>
          ) : null}

          {phase === "result" && callResult ? (
            <div className={`ivr-result-screen ivr-result-${callResult.verdict.toLowerCase()}`}>
              <div className="ivr-result-icon"><BadgeCheck size={30} /></div>
              <span className="ivr-step">SPOKEN RESULT</span>
              <h3>{callResult.verdict === "UNVERIFIED" ? "NEEDS EVIDENCE" : callResult.verdict}</h3>
              <p>{verdictCopy[callResult.verdict] ?? DEFAULT_VERDICTS.UNVERIFIED}</p>
              <div className="ivr-result-meta">
                <span><small>Confidence</small><strong>{callResult.confidence}</strong></span>
                <span><small>Official sources</small><strong>{callResult.sourceCount}</strong></span>
              </div>
              {demoMode ? <div className="ivr-demo-note">Demo fallback shown because the live verification service is unavailable.</div> : null}
              {voiceNotice ? <div className="ivr-voice-note">{voiceNotice}</div> : null}
              <button type="button" className="ivr-listen" onClick={() => setVoiceNotice(speak(verdictCopy[callResult.verdict] ?? DEFAULT_VERDICTS.UNVERIFIED, language))}><Volume2 size={17} /> Listen again</button>
              <button type="button" className="ivr-again" onClick={resetClaim}><RotateCcw size={16} /> {selectedCopy.again}</button>
            </div>
          ) : null}

          {phase === "ended" ? (
            <div className="ivr-ended-screen">
              <span className="ivr-ended-icon"><PhoneOff size={26} /></span>
              <h3>Call ended</h3>
              <p>Evidence before belief.</p>
              <button type="button" onClick={() => setPhase("language")}><PhoneCall size={17} /> Call again</button>
            </div>
          ) : null}
        </div>

        <div className="ivr-phone-footer">
          <span><ShieldCheck size={15} /> Voice-first browser simulation</span>
          {phase !== "ended" ? <button type="button" className="ivr-end-call" onClick={() => setPhase("ended")} aria-label="End call"><PhoneOff size={19} /></button> : null}
          {phase === "claim" && spokenClaim ? <button type="button" className="ivr-clear" onClick={() => setSpokenClaim("")} aria-label="Clear claim"><Delete size={18} /></button> : null}
        </div>
      </section>
    </div>,
    document.body,
  );
}

function createSafeDemoResult(claim: string, language: IvrLanguage): VerifyResponse {
  const normalized = claim.toLowerCase();
  const matchedPack = OFFLINE_PACKS.find((pack) => pack.keywords.some((keyword) => normalized.includes(keyword))) ?? OFFLINE_PACKS[2];
  return {
    ...matchedPack.result,
    claim,
    checkedAt: new Date().toISOString(),
    language,
    offline: true,
  };
}

function speak(text: string, language: IvrLanguage) {
  if (!("speechSynthesis" in window) || !text) return "This browser does not support speech playback.";
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language;
  utterance.rate = 0.88;
  const voices = window.speechSynthesis.getVoices();
  const matchingVoice = voices.find((voice) => voice.lang.toLowerCase() === language.toLowerCase());
  if (matchingVoice) utterance.voice = matchingVoice;
  window.speechSynthesis.speak(utterance);
  return matchingVoice || voices.length === 0 ? "" : "Text is localized. Voice playback depends on the languages installed in this browser.";
}
