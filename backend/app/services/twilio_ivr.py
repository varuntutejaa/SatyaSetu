"""TwiML builders for SatyaSetu's multilingual phone verification flow.

These functions are deliberately independent from FastAPI so the call flow can
be unit-tested without making external Twilio requests.
"""

from __future__ import annotations

from dataclasses import dataclass

from twilio.twiml.voice_response import Gather, VoiceResponse


@dataclass(frozen=True)
class LanguageProfile:
    code: str
    menu_digit: str
    name: str
    native_name: str
    gather_locale: str
    say_locale: str
    voice: str
    menu_prompt: str
    claim_prompt: str
    no_speech: str
    unavailable: str
    another_prompt: str
    goodbye: str


LANGUAGES = {
    "hi-IN": LanguageProfile(
        code="hi-IN",
        menu_digit="1",
        name="Hindi",
        native_name="हिंदी",
        gather_locale="hi-IN",
        say_locale="hi-IN",
        voice="Google.hi-IN-Standard-A",
        menu_prompt="हिंदी के लिए एक दबाएँ।",
        claim_prompt="बीप के बाद वह संदेश या जानकारी बोलें जिसकी आप जाँच करना चाहते हैं।",
        no_speech="हमें आपकी आवाज़ साफ़ सुनाई नहीं दी। कृपया दोबारा बोलें।",
        unavailable="अभी सत्यापन सेवा उपलब्ध नहीं है। कृपया थोड़ी देर बाद दोबारा कॉल करें।",
        another_prompt="दूसरी जानकारी जाँचने के लिए एक दबाएँ। कॉल समाप्त करने के लिए फोन रख दें।",
        goodbye="सत्यसेतु का उपयोग करने के लिए धन्यवाद। किसी जानकारी पर विश्वास करने या उसे आगे भेजने से पहले जाँच करें।",
    ),
    "pa-IN": LanguageProfile(
        code="pa-IN",
        menu_digit="2",
        name="Punjabi",
        native_name="ਪੰਜਾਬੀ",
        # Twilio's speech provider uses the Gurmukhi-specific locale while
        # Twilio <Say> uses pa-IN for Punjabi text-to-speech.
        gather_locale="pa-guru-IN",
        say_locale="pa-IN",
        voice="Google.pa-IN-Standard-A",
        menu_prompt="ਪੰਜਾਬੀ ਲਈ ਦੋ ਦਬਾਓ।",
        claim_prompt="ਬੀਪ ਤੋਂ ਬਾਅਦ ਉਹ ਸੁਨੇਹਾ ਜਾਂ ਜਾਣਕਾਰੀ ਬੋਲੋ ਜਿਸਦੀ ਤੁਸੀਂ ਜਾਂਚ ਕਰਨੀ ਚਾਹੁੰਦੇ ਹੋ।",
        no_speech="ਸਾਨੂੰ ਤੁਹਾਡੀ ਆਵਾਜ਼ ਸਾਫ਼ ਨਹੀਂ ਸੁਣੀ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਬੋਲੋ।",
        unavailable="ਤਸਦੀਕ ਸੇਵਾ ਇਸ ਵੇਲੇ ਉਪਲਬਧ ਨਹੀਂ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਕੁਝ ਸਮੇਂ ਬਾਅਦ ਦੁਬਾਰਾ ਕਾਲ ਕਰੋ।",
        another_prompt="ਹੋਰ ਜਾਣਕਾਰੀ ਦੀ ਜਾਂਚ ਲਈ ਇੱਕ ਦਬਾਓ। ਕਾਲ ਖਤਮ ਕਰਨ ਲਈ ਫੋਨ ਰੱਖ ਦਿਓ।",
        goodbye="ਸਤਿਆਸੇਤੂ ਵਰਤਣ ਲਈ ਧੰਨਵਾਦ। ਕਿਸੇ ਜਾਣਕਾਰੀ ਤੇ ਭਰੋਸਾ ਕਰਨ ਜਾਂ ਅੱਗੇ ਭੇਜਣ ਤੋਂ ਪਹਿਲਾਂ ਜਾਂਚ ਕਰੋ।",
    ),
    "en-IN": LanguageProfile(
        code="en-IN",
        menu_digit="#",
        name="English",
        native_name="English",
        gather_locale="en-IN",
        say_locale="en-IN",
        voice="Google.en-IN-Standard-A",
        menu_prompt="For English, press pound.",
        claim_prompt="After the beep, say the message or information you want to verify.",
        no_speech="We could not hear you clearly. Please say the message again.",
        unavailable="The verification service is temporarily unavailable. Please call again later.",
        another_prompt="To check another message, press 1. Otherwise, you may hang up.",
        goodbye="Thank you for using SatyaSetu. Check information before you trust it or forward it.",
    ),
    "bn-IN": LanguageProfile(
        code="bn-IN",
        menu_digit="3",
        name="Bengali",
        native_name="বাংলা",
        gather_locale="bn-IN",
        say_locale="bn-IN",
        voice="Google.bn-IN-Standard-A",
        menu_prompt="বাংলার জন্য তিন চাপুন।",
        claim_prompt="বিপের পরে যে বার্তা বা তথ্য যাচাই করতে চান তা বলুন।",
        no_speech="আপনার কথা পরিষ্কার শোনা যায়নি। অনুগ্রহ করে আবার বলুন।",
        unavailable="যাচাই পরিষেবা সাময়িকভাবে উপলব্ধ নয়। অনুগ্রহ করে পরে আবার কল করুন।",
        another_prompt="আরেকটি তথ্য যাচাই করতে এক চাপুন। নাহলে ফোন কেটে দিতে পারেন।",
        goodbye="সত্যসেতু ব্যবহার করার জন্য ধন্যবাদ। বিশ্বাস বা ফরোয়ার্ড করার আগে তথ্য যাচাই করুন।",
    ),
    "ta-IN": LanguageProfile(
        code="ta-IN",
        menu_digit="4",
        name="Tamil",
        native_name="தமிழ்",
        gather_locale="ta-IN",
        say_locale="ta-IN",
        voice="Google.ta-IN-Standard-A",
        menu_prompt="தமிழுக்கு நான்கு அழுத்தவும்.",
        claim_prompt="பீப் ஒலிக்குப் பிறகு நீங்கள் சரிபார்க்க விரும்பும் செய்தி அல்லது தகவலைச் சொல்லுங்கள்.",
        no_speech="உங்கள் குரல் தெளிவாக கேட்கவில்லை. மீண்டும் சொல்லுங்கள்.",
        unavailable="சரிபார்ப்பு சேவை தற்காலிகமாக கிடைக்கவில்லை. பின்னர் மீண்டும் அழைக்கவும்.",
        another_prompt="மற்றொரு தகவலைச் சரிபார்க்க ஒன்று அழுத்தவும். இல்லையெனில் அழைப்பை நிறுத்தலாம்.",
        goodbye="சத்யசேதுவைப் பயன்படுத்தியதற்கு நன்றி. நம்புவதற்கு அல்லது பகிர்வதற்கு முன் தகவலைச் சரிபார்க்கவும்.",
    ),
    "te-IN": LanguageProfile(
        code="te-IN",
        menu_digit="5",
        name="Telugu",
        native_name="తెలుగు",
        gather_locale="te-IN",
        say_locale="te-IN",
        voice="Google.te-IN-Standard-A",
        menu_prompt="తెలుగు కోసం ఐదు నొక్కండి.",
        claim_prompt="బీప్ తర్వాత మీరు ధృవీకరించాలనుకునే సందేశం లేదా సమాచారాన్ని చెప్పండి.",
        no_speech="మీ మాట స్పష్టంగా వినిపించలేదు. దయచేసి మళ్లీ చెప్పండి.",
        unavailable="ధృవీకరణ సేవ తాత్కాలికంగా అందుబాటులో లేదు. దయచేసి తర్వాత మళ్లీ కాల్ చేయండి.",
        another_prompt="మరో సమాచారాన్ని తనిఖీ చేయడానికి ఒకటి నొక్కండి. లేకపోతే కాల్ ముగించవచ్చు.",
        goodbye="సత్యసేతును ఉపయోగించినందుకు ధన్యవాదాలు. నమ్మే ముందు లేదా పంపే ముందు సమాచారాన్ని తనిఖీ చేయండి.",
    ),
    "gu-IN": LanguageProfile(
        code="gu-IN",
        menu_digit="6",
        name="Gujarati",
        native_name="ગુજરાતી",
        gather_locale="gu-IN",
        say_locale="gu-IN",
        voice="Google.gu-IN-Standard-A",
        menu_prompt="ગુજરાતી માટે છ દબાવો.",
        claim_prompt="બીપ પછી તમે ચકાસવા માંગતા સંદેશ અથવા માહિતી બોલો.",
        no_speech="તમારો અવાજ સ્પષ્ટ સાંભળાયો નથી. કૃપા કરીને ફરી બોલો.",
        unavailable="ચકાસણી સેવા હાલમાં ઉપલબ્ધ નથી. કૃપા કરીને થોડા સમય પછી ફરી કોલ કરો.",
        another_prompt="બીજી માહિતી ચકાસવા માટે એક દબાવો. નહિ તો ફોન મૂકી શકો છો.",
        goodbye="સત્યસેતુનો ઉપયોગ કરવા બદલ આભાર. વિશ્વાસ કરતા કે આગળ મોકલતા પહેલા માહિતી ચકાસો.",
    ),
    "kn-IN": LanguageProfile(
        code="kn-IN",
        menu_digit="7",
        name="Kannada",
        native_name="ಕನ್ನಡ",
        gather_locale="kn-IN",
        say_locale="kn-IN",
        voice="Google.kn-IN-Standard-A",
        menu_prompt="ಕನ್ನಡಕ್ಕಾಗಿ ಏಳು ಒತ್ತಿರಿ.",
        claim_prompt="ಬೀಪ್ ನಂತರ ನೀವು ಪರಿಶೀಲಿಸಲು ಬಯಸುವ ಸಂದೇಶ ಅಥವಾ ಮಾಹಿತಿಯನ್ನು ಹೇಳಿ.",
        no_speech="ನಿಮ್ಮ ಧ್ವನಿ ಸ್ಪಷ್ಟವಾಗಿ ಕೇಳಿಸಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಹೇಳಿ.",
        unavailable="ಪರಿಶೀಲನಾ ಸೇವೆ ತಾತ್ಕಾಲಿಕವಾಗಿ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ನಂತರ ಮತ್ತೆ ಕರೆ ಮಾಡಿ.",
        another_prompt="ಮತ್ತೊಂದು ಮಾಹಿತಿಯನ್ನು ಪರಿಶೀಲಿಸಲು ಒಂದು ಒತ್ತಿರಿ. ಇಲ್ಲದಿದ್ದರೆ ಕರೆ ಮುಗಿಸಬಹುದು.",
        goodbye="ಸತ್ಯಸೇತು ಬಳಸಿದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು. ನಂಬುವ ಮೊದಲು ಅಥವಾ ಹಂಚುವ ಮೊದಲು ಮಾಹಿತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ.",
    ),
    "ml-IN": LanguageProfile(
        code="ml-IN",
        menu_digit="8",
        name="Malayalam",
        native_name="മലയാളം",
        gather_locale="ml-IN",
        say_locale="ml-IN",
        voice="Google.ml-IN-Standard-A",
        menu_prompt="മലയാളത്തിനായി എട്ട് അമർത്തുക.",
        claim_prompt="ബീപ്പിന് ശേഷം നിങ്ങൾ പരിശോധിക്കാൻ ആഗ്രഹിക്കുന്ന സന്ദേശം അല്ലെങ്കിൽ വിവരം പറയുക.",
        no_speech="നിങ്ങളുടെ ശബ്ദം വ്യക്തമായി കേൾക്കാനായില്ല. ദയവായി വീണ്ടും പറയുക.",
        unavailable="പരിശോധനാ സേവനം താൽക്കാലികമായി ലഭ്യമല്ല. ദയവായി പിന്നീട് വീണ്ടും വിളിക്കുക.",
        another_prompt="മറ്റൊരു വിവരം പരിശോധിക്കാൻ ഒന്ന് അമർത്തുക. അല്ലെങ്കിൽ ഫോൺ വയ്ക്കാം.",
        goodbye="സത്യസേതു ഉപയോഗിച്ചതിന് നന്ദി. വിശ്വസിക്കുന്നതിനു മുമ്പും പങ്കിടുന്നതിനു മുമ്പും വിവരം പരിശോധിക്കുക.",
    ),
    "mr-IN": LanguageProfile(
        code="mr-IN",
        menu_digit="9",
        name="Marathi",
        native_name="मराठी",
        gather_locale="mr-IN",
        say_locale="mr-IN",
        voice="Google.mr-IN-Standard-A",
        menu_prompt="मराठीसाठी नऊ दाबा.",
        claim_prompt="बीपनंतर तुम्हाला तपासायचा संदेश किंवा माहिती बोला.",
        no_speech="तुमचा आवाज स्पष्ट ऐकू आला नाही. कृपया पुन्हा बोला.",
        unavailable="तपासणी सेवा सध्या उपलब्ध नाही. कृपया थोड्या वेळाने पुन्हा कॉल करा.",
        another_prompt="दुसरी माहिती तपासण्यासाठी एक दाबा. अन्यथा फोन ठेवू शकता.",
        goodbye="सत्यसेतू वापरल्याबद्दल धन्यवाद. विश्वास ठेवण्यापूर्वी किंवा पुढे पाठवण्यापूर्वी माहिती तपासा.",
    ),
    "od-IN": LanguageProfile(
        code="od-IN",
        menu_digit="0",
        name="Odia",
        native_name="ଓଡ଼ିଆ",
        gather_locale="od-IN",
        say_locale="od-IN",
        voice="Google.or-IN-Standard-A",
        menu_prompt="ଓଡ଼ିଆ ପାଇଁ ଶୂନ୍ୟ ଦବାନ୍ତୁ।",
        claim_prompt="ବୀପ୍ ପରେ ଆପଣ ଯାଞ୍ଚ କରିବାକୁ ଚାହୁଁଥିବା ସନ୍ଦେଶ କିମ୍ବା ସୂଚନା କହନ୍ତୁ।",
        no_speech="ଆପଣଙ୍କ ଶବ୍ଦ ସ୍ପଷ୍ଟ ଶୁଣାଗଲା ନାହିଁ। ଦୟାକରି ପୁଣି କହନ୍ତୁ।",
        unavailable="ଯାଞ୍ଚ ସେବା ଏବେ ଉପଲବ୍ଧ ନାହିଁ। ଦୟାକରି ପରେ ପୁଣି କଲ୍ କରନ୍ତୁ।",
        another_prompt="ଆଉ ଏକ ସୂଚନା ଯାଞ୍ଚ କରିବାକୁ ଏକ ଦବାନ୍ତୁ। ନହେଲେ ଫୋନ୍ ରଖିପାରିବେ।",
        goodbye="ସତ୍ୟସେତୁ ବ୍ୟବହାର କରିଥିବାରୁ ଧନ୍ୟବାଦ। ବିଶ୍ୱାସ କିମ୍ବା ଆଗକୁ ପଠାଇବା ପୂର୍ବରୁ ସୂଚନା ଯାଞ୍ଚ କରନ୍ତୁ।",
    ),
}

LANGUAGES["or-IN"] = LANGUAGES["od-IN"]
DIGIT_TO_LANGUAGE = {profile.menu_digit: code for code, profile in LANGUAGES.items() if code != "or-IN"}
SUPPORTED_LANGUAGE_CODES = [code for code in LANGUAGES if code != "or-IN"]


RESULT_MESSAGES = {
    "hi-IN": {
        "VERIFIED": "परिणाम। यह जानकारी सत्यापित है। विश्वसनीय सरकारी प्रमाण इसका समर्थन करता है।",
        "CONTRADICTED": "चेतावनी। यह जानकारी विश्वसनीय सरकारी प्रमाण से मेल नहीं खाती। कृपया इसे आगे न भेजें।",
        "UNVERIFIED": "इस जानकारी के लिए पर्याप्त सरकारी प्रमाण नहीं मिला। इसे सही न मानें और आगे न भेजें।",
        "sources": "सत्यसेतु ने {source_count} आधिकारिक स्रोतों से मिले प्रमाण की जाँच की।",
        "fraud": "अगर आपने पैसे या बैंक की जानकारी साझा की है, तो तुरंत एक नौ तीन शून्य पर कॉल करें।",
    },
    "pa-IN": {
        "VERIFIED": "ਨਤੀਜਾ। ਇਹ ਜਾਣਕਾਰੀ ਤਸਦੀਕਸ਼ੁਦਾ ਹੈ। ਭਰੋਸੇਯੋਗ ਸਰਕਾਰੀ ਸਬੂਤ ਇਸਦੀ ਪੁਸ਼ਟੀ ਕਰਦਾ ਹੈ।",
        "CONTRADICTED": "ਚੇਤਾਵਨੀ। ਇਹ ਜਾਣਕਾਰੀ ਭਰੋਸੇਯੋਗ ਸਰਕਾਰੀ ਸਬੂਤ ਨਾਲ ਮੇਲ ਨਹੀਂ ਖਾਂਦੀ। ਕਿਰਪਾ ਕਰਕੇ ਇਸਨੂੰ ਅੱਗੇ ਨਾ ਭੇਜੋ।",
        "UNVERIFIED": "ਇਸ ਜਾਣਕਾਰੀ ਲਈ ਲੋੜੀਂਦਾ ਸਰਕਾਰੀ ਸਬੂਤ ਨਹੀਂ ਮਿਲਿਆ। ਇਸਨੂੰ ਸਹੀ ਨਾ ਮੰਨੋ ਅਤੇ ਅੱਗੇ ਨਾ ਭੇਜੋ।",
        "sources": "ਸਤਿਆਸੇਤੂ ਨੇ {source_count} ਸਰਕਾਰੀ ਸਰੋਤਾਂ ਤੋਂ ਮਿਲੇ ਸਬੂਤ ਦੀ ਜਾਂਚ ਕੀਤੀ।",
        "fraud": "ਜੇ ਤੁਸੀਂ ਪੈਸੇ ਜਾਂ ਬੈਂਕ ਦੀ ਜਾਣਕਾਰੀ ਸਾਂਝੀ ਕੀਤੀ ਹੈ, ਤਾਂ ਤੁਰੰਤ ਇੱਕ ਨੌ ਤਿੰਨ ਸਿਫਰ ਤੇ ਕਾਲ ਕਰੋ।",
    },
    "en-IN": {
        "VERIFIED": "Result. This information is verified. Reliable official evidence supports it.",
        "CONTRADICTED": "Warning. This information conflicts with reliable official evidence. Please do not forward it.",
        "UNVERIFIED": "There is not enough official evidence to confirm this information. Do not treat it as true or forward it.",
        "sources": "SatyaSetu checked evidence from {source_count} official sources.",
        "fraud": "If you shared money or banking information, call 1 9 3 0 immediately.",
    },
    "bn-IN": {
        "VERIFIED": "ফলাফল। এই তথ্য যাচাই করা হয়েছে। নির্ভরযোগ্য সরকারি প্রমাণ এটিকে সমর্থন করে।",
        "CONTRADICTED": "সতর্কতা। এই তথ্য নির্ভরযোগ্য সরকারি প্রমাণের সঙ্গে মেলে না। অনুগ্রহ করে এটি ফরোয়ার্ড করবেন না।",
        "UNVERIFIED": "এই তথ্য নিশ্চিত করার মতো যথেষ্ট সরকারি প্রমাণ পাওয়া যায়নি। এটিকে সত্য ধরে নেবেন না বা ফরোয়ার্ড করবেন না।",
        "sources": "সত্যসেতু {source_count}টি সরকারি উৎসের প্রমাণ যাচাই করেছে।",
        "fraud": "আপনি যদি টাকা বা ব্যাংকের তথ্য শেয়ার করে থাকেন, তাহলে অবিলম্বে এক নয় তিন শূন্য নম্বরে কল করুন।",
    },
    "ta-IN": {
        "VERIFIED": "முடிவு. இந்த தகவல் சரிபார்க்கப்பட்டது. நம்பகமான அரசுத் தகவல் இதை ஆதரிக்கிறது.",
        "CONTRADICTED": "எச்சரிக்கை. இந்த தகவல் நம்பகமான அரசுத் தகவலுடன் பொருந்தவில்லை. தயவுசெய்து இதை பகிர வேண்டாம்.",
        "UNVERIFIED": "இந்த தகவலை உறுதிப்படுத்த போதுமான அரசுச் சான்று கிடைக்கவில்லை. இதை உண்மை என்று கருத வேண்டாம், பகிரவும் வேண்டாம்.",
        "sources": "சத்யசேது {source_count} அரசுத் தகவல் மூலங்களில் உள்ள சான்றுகளைச் சரிபார்த்தது.",
        "fraud": "நீங்கள் பணம் அல்லது வங்கி தகவலை பகிர்ந்திருந்தால், உடனே ஒன்று ஒன்பது மூன்று பூஜ்யம் எண்ணுக்கு அழைக்கவும்.",
    },
    "te-IN": {
        "VERIFIED": "ఫలితం. ఈ సమాచారం ధృవీకరించబడింది. విశ్వసనీయ ప్రభుత్వ ఆధారాలు దీనికి మద్దతు ఇస్తున్నాయి.",
        "CONTRADICTED": "హెచ్చరిక. ఈ సమాచారం విశ్వసనీయ ప్రభుత్వ ఆధారాలతో సరిపోలడం లేదు. దయచేసి దీన్ని ముందుకు పంపవద్దు.",
        "UNVERIFIED": "ఈ సమాచారాన్ని నిర్ధారించడానికి తగిన ప్రభుత్వ ఆధారాలు దొరకలేదు. దీన్ని నిజం అనుకోకండి, ముందుకు పంపవద్దు.",
        "sources": "సత్యసేతు {source_count} అధికారిక మూలాల ఆధారాలను తనిఖీ చేసింది.",
        "fraud": "మీరు డబ్బు లేదా బ్యాంకు సమాచారం పంచుకున్నట్లయితే, వెంటనే ఒకటి తొమ్మిది మూడు సున్నా నంబర్‌కు కాల్ చేయండి.",
    },
    "gu-IN": {
        "VERIFIED": "પરિણામ. આ માહિતી ચકાસાયેલ છે. વિશ્વસનીય સરકારી પુરાવા તેને સમર્થન આપે છે.",
        "CONTRADICTED": "ચેતવણી. આ માહિતી વિશ્વસનીય સરકારી પુરાવા સાથે મેળ ખાતી નથી. કૃપા કરીને તેને આગળ મોકલશો નહીં.",
        "UNVERIFIED": "આ માહિતીની પુષ્ટિ કરવા પૂરતા સરકારી પુરાવા મળ્યા નથી. તેને સાચી માનીને આગળ મોકલશો નહીં.",
        "sources": "સત્યસેતુએ {source_count} સત્તાવાર સ્ત્રોતોના પુરાવા ચકાસ્યા.",
        "fraud": "જો તમે પૈસા અથવા બેંક માહિતી શેર કરી હોય, તો તરત એક નવ ત્રણ શૂન્ય પર કોલ કરો.",
    },
    "kn-IN": {
        "VERIFIED": "ಫಲಿತಾಂಶ. ಈ ಮಾಹಿತಿ ಪರಿಶೀಲಿಸಲಾಗಿದೆ. ನಂಬಿಗಸ್ತ ಸರ್ಕಾರಿ ಸಾಕ್ಷ್ಯ ಇದನ್ನು ಬೆಂಬಲಿಸುತ್ತದೆ.",
        "CONTRADICTED": "ಎಚ್ಚರಿಕೆ. ಈ ಮಾಹಿತಿ ನಂಬಿಗಸ್ತ ಸರ್ಕಾರಿ ಸಾಕ್ಷ್ಯಕ್ಕೆ ಹೊಂದಿಕೆಯಾಗುವುದಿಲ್ಲ. ದಯವಿಟ್ಟು ಇದನ್ನು ಹಂಚಬೇಡಿ.",
        "UNVERIFIED": "ಈ ಮಾಹಿತಿಯನ್ನು ದೃಢೀಕರಿಸಲು ಸಾಕಷ್ಟು ಸರ್ಕಾರಿ ಸಾಕ್ಷ್ಯ ಸಿಕ್ಕಿಲ್ಲ. ಇದನ್ನು ಸತ್ಯವೆಂದು ನಂಬಬೇಡಿ ಅಥವಾ ಹಂಚಬೇಡಿ.",
        "sources": "ಸತ್ಯಸೇತು {source_count} ಅಧಿಕೃತ ಮೂಲಗಳ ಸಾಕ್ಷ್ಯವನ್ನು ಪರಿಶೀಲಿಸಿದೆ.",
        "fraud": "ನೀವು ಹಣ ಅಥವಾ ಬ್ಯಾಂಕ್ ಮಾಹಿತಿಯನ್ನು ಹಂಚಿಕೊಂಡಿದ್ದರೆ, ತಕ್ಷಣ ಒಂದು ಒಂಬತ್ತು ಮೂರು ಸೊನ್ನೆಗೆ ಕರೆ ಮಾಡಿ.",
    },
    "ml-IN": {
        "VERIFIED": "ഫലം. ഈ വിവരം പരിശോധിച്ചുറപ്പിച്ചു. വിശ്വസനീയമായ സർക്കാർ തെളിവ് ഇതിനെ പിന്തുണയ്ക്കുന്നു.",
        "CONTRADICTED": "മുന്നറിയിപ്പ്. ഈ വിവരം വിശ്വസനീയമായ സർക്കാർ തെളിവുമായി പൊരുത്തപ്പെടുന്നില്ല. ദയവായി ഇത് ഫോർവേഡ് ചെയ്യരുത്.",
        "UNVERIFIED": "ഈ വിവരം സ്ഥിരീകരിക്കാൻ മതിയായ സർക്കാർ തെളിവ് കണ്ടെത്തിയില്ല. ഇതിനെ സത്യമായി കരുതരുത്, ഫോർവേഡ് ചെയ്യരുത്.",
        "sources": "സത്യസേതു {source_count} ഔദ്യോഗിക ഉറവിടങ്ങളിലെ തെളിവുകൾ പരിശോധിച്ചു.",
        "fraud": "നിങ്ങൾ പണമോ ബാങ്ക് വിവരമോ പങ്കിട്ടിട്ടുണ്ടെങ്കിൽ, ഉടൻ ഒന്ന് ഒമ്പത് മൂന്ന് പൂജ്യം എന്ന നമ്പറിൽ വിളിക്കുക.",
    },
    "mr-IN": {
        "VERIFIED": "निकाल. ही माहिती सत्यापित आहे. विश्वासार्ह सरकारी पुरावा याला समर्थन देतो.",
        "CONTRADICTED": "इशारा. ही माहिती विश्वासार्ह सरकारी पुराव्याशी जुळत नाही. कृपया ती पुढे पाठवू नका.",
        "UNVERIFIED": "ही माहिती खात्री करण्यासाठी पुरेसा सरकारी पुरावा सापडला नाही. ती खरी मानू नका किंवा पुढे पाठवू नका.",
        "sources": "सत्यसेतूने {source_count} अधिकृत स्रोतांमधील पुरावा तपासला.",
        "fraud": "तुम्ही पैसे किंवा बँकेची माहिती शेअर केली असल्यास, लगेच एक नऊ तीन शून्य वर कॉल करा.",
    },
    "od-IN": {
        "VERIFIED": "ଫଳାଫଳ। ଏହି ସୂଚନା ଯାଞ୍ଚିତ। ବିଶ୍ୱସନୀୟ ସରକାରୀ ପ୍ରମାଣ ଏହାକୁ ସମର୍ଥନ କରେ।",
        "CONTRADICTED": "ସତର୍କ। ଏହି ସୂଚନା ବିଶ୍ୱସନୀୟ ସରକାରୀ ପ୍ରମାଣ ସହିତ ମେଳ ଖାଉନାହିଁ। ଦୟାକରି ଏହାକୁ ଆଗକୁ ପଠାନ୍ତୁ ନାହିଁ।",
        "UNVERIFIED": "ଏହି ସୂଚନା ନିଶ୍ଚିତ କରିବାକୁ ପର୍ଯ୍ୟାପ୍ତ ସରକାରୀ ପ୍ରମାଣ ମିଳିଲା ନାହିଁ। ଏହାକୁ ସତ୍ୟ ଭାବନ୍ତୁ ନାହିଁ କିମ୍ବା ଆଗକୁ ପଠାନ୍ତୁ ନାହିଁ।",
        "sources": "ସତ୍ୟସେତୁ {source_count}ଟି ଅଧିକୃତ ସ୍ରୋତର ପ୍ରମାଣ ଯାଞ୍ଚ କରିଛି।",
        "fraud": "ଯଦି ଆପଣ ଟଙ୍କା କିମ୍ବା ବ୍ୟାଙ୍କ ସୂଚନା ସେୟାର କରିଛନ୍ତି, ତେବେ ତୁରନ୍ତ ଏକ ନଅ ତିନି ଶୂନ୍ୟକୁ କଲ୍ କରନ୍ତୁ।",
    },
}

for _code in SUPPORTED_LANGUAGE_CODES:
    RESULT_MESSAGES.setdefault(_code, RESULT_MESSAGES["en-IN"])


def get_language(code: str | None) -> LanguageProfile:
    return LANGUAGES.get(code or "", LANGUAGES["hi-IN"])


def _say(response: VoiceResponse | Gather, text: str, language: LanguageProfile) -> None:
    response.say(text, language=language.say_locale, voice=language.voice)


def build_welcome_twiml() -> str:
    response = VoiceResponse()
    gather = Gather(
        input="dtmf",
        num_digits=1,
        timeout=8,
        action="/api/ivr/language",
        method="POST",
        action_on_empty_result=True,
    )
    _say(gather, "सत्यसेतु में आपका स्वागत है।", LANGUAGES["hi-IN"])
    for language in (profile for code, profile in LANGUAGES.items() if code in SUPPORTED_LANGUAGE_CODES):
        _say(gather, language.menu_prompt, language)
    response.append(gather)
    return str(response)


def build_claim_prompt_twiml(language: LanguageProfile, attempt: int = 0) -> str:
    response = VoiceResponse()
    if attempt:
        _say(response, language.no_speech, language)
    gather = Gather(
        input="speech",
        action=f"/api/ivr/verify?lang={language.code}&attempt={attempt}",
        method="POST",
        language=language.gather_locale,
        speech_model="default",
        speech_timeout=4,
        timeout=8,
        action_on_empty_result=True,
    )
    _say(gather, language.claim_prompt, language)
    response.append(gather)
    return str(response)


def build_unavailable_twiml(language: LanguageProfile) -> str:
    response = VoiceResponse()
    _say(response, language.unavailable, language)
    response.hangup()
    return str(response)


def build_goodbye_twiml(language: LanguageProfile) -> str:
    response = VoiceResponse()
    _say(response, language.goodbye, language)
    response.hangup()
    return str(response)


def build_result_twiml(result: dict, language: LanguageProfile) -> str:
    response = VoiceResponse()
    verdict = result.get("verdict", "UNVERIFIED")
    source_count = int(result.get("sourceCount", 0))
    evidence = result.get("evidence") or []
    category = evidence[0].get("category", "") if evidence else ""

    messages = RESULT_MESSAGES[language.code]

    _say(response, messages.get(verdict, messages["UNVERIFIED"]), language)
    _say(response, messages["sources"].format(source_count=source_count), language)
    if verdict == "CONTRADICTED" and category in {"finance", "financial_safety", "cybercrime"}:
        _say(response, messages["fraud"], language)

    gather = Gather(
        input="dtmf",
        num_digits=1,
        timeout=7,
        action=f"/api/ivr/restart?lang={language.code}",
        method="POST",
        action_on_empty_result=True,
    )
    _say(gather, language.another_prompt, language)
    response.append(gather)
    _say(response, language.goodbye, language)
    response.hangup()
    return str(response)
