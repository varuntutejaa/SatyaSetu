# SatyaSetu

**Evidence before belief.**

SatyaSetu is a multilingual public-information verification platform for government schemes, fraud alerts, public health messages, education claims, and citizen-facing misinformation. It helps a user ask a question through web, voice, WhatsApp, or kiosk-style flows and receive a clear answer backed by official sources.

The product is designed for citizens, field workers, service centers, district teams, NGOs, and public institutions that need reliable answers without asking people to blindly trust an AI response.

---

## What It Does

- Verifies claims against a trusted source registry.
- Shows verdicts as `VERIFIED`, `CONTRADICTED`, or `UNVERIFIED`.
- Displays official evidence, source links, confidence, freshness, and limitations.
- Supports typed questions, voice questions, screenshot/OCR verification, WhatsApp sandbox entry, offline cache, sync queue, and shareable proof receipts.
- Uses AI only as an evidence-comparison helper. The final verdict is decided by deterministic rules.

---

## Core Flow

```text
Claim
  -> Claim extraction
  -> Language detection / translation
  -> Trusted-source retrieval
  -> Evidence ranking
  -> Evidence comparison
  -> Deterministic verdict
  -> Simple explanation
  -> Voice / receipt / WhatsApp response
```

---

## Tech Stack

### Frontend

- Next.js 16
- React 18
- TypeScript
- Tailwind CSS
- Lucide React icons
- PWA manifest and service-worker registration
- IndexedDB with Dexie for offline cache and sync queue
- Browser `MediaRecorder` API for microphone recording
- QR receipt generation with `qrcode`

### Backend

- FastAPI
- Python 3.11
- SQLAlchemy ORM
- Pydantic / Pydantic Settings
- Uvicorn
- SQLite for local development
- Postgres-ready through `DATABASE_URL`
- Pytest test suite

### Verification / RAG

- Retrieval-Augmented Generation style evidence workflow
- Local hashing embeddings for zero-key development
- Source-authority-aware ranking
- Curated official-source registry
- Deterministic verification engine
- LLM comparator interface
- Rule-based comparator fallback
- Anthropic/Groq-compatible provider architecture

### Voice, Language, OCR

- Sarvam AI Speech-to-Text
- Sarvam AI Text-to-Speech
- Sarvam AI Translation
- Hindi, Punjabi, and Indian English language paths
- Tesseract OCR provider
- Image compression before upload
- Screenshot-to-verification flow

### Channels

- Web assistant
- Navbar voice agent
- Dedicated voice-agent page
- WhatsApp sandbox redirect
- Twilio WhatsApp webhook backend
- Twilio IVR voice helpline
- Evidence receipt page
- Offline trust packs
- Community report signals

---

## Repository Structure

```text
SatyaSetu/
  backend/
    app/
      api/                  FastAPI routes
      database/             SQLAlchemy setup and seed data
      models/               Database models
      providers/            LLM, embeddings, OCR, speech, TTS, translation providers
      rag/                  Retrieval and ranking
      services/             Verification pipeline and claim extraction
      verification/         Deterministic verdict engine
      utils/                Language and text helpers
    tests/                  Backend test suite
    requirements.txt
    run.py

  frontend/
    app/                    Next.js App Router pages
    components/             UI components and feature surfaces
    hooks/                  Assistant, recorder, sync, connectivity hooks
    lib/                    i18n, IndexedDB, offline packs, result copy helpers
    services/               Typed API client
    public/                 PWA and visual assets
    package.json
```

---

## Main Features

### 1. Evidence-Based Verification

Users can paste or type a public claim. SatyaSetu retrieves relevant official evidence, compares the claim with the evidence, and returns a verdict with source links.

### 2. Deterministic Verdict Engine

The final verdict is never directly decided by an LLM. The comparator labels evidence as:

- `SUPPORTS`
- `CONTRADICTS`
- `NEUTRAL`

Then `backend/app/verification/engine.py` applies fixed rules based on source authority, relevance, freshness, and conflicts.

This prevents dangerous behavior such as treating "no evidence found" as "false".

### 3. Multilingual Voice Agent

The navbar `Speak To Check` flow records a short voice question and sends it to the backend voice-agent route.

Backend flow:

```text
Audio
  -> Sarvam STT
  -> Translate to English if needed for source matching
  -> Verification pipeline
  -> Translate answer back to spoken language
  -> Sarvam TTS
  -> Spoken response
```

The recorder is capped to reduce unnecessary API usage. The UI shows:

- Listening
- Transcribing
- Checking
- Speaking

### 4. OCR Verification

The app supports screenshot/image verification through:

- Frontend image compression
- Backend `/api/ocr`
- Tesseract OCR provider
- Same verification pipeline after extracted text

### 5. WhatsApp Sandbox

The WhatsApp page redirects users to the sandbox number:

```text
+14155238886
```

The page includes simple instructions for opening WhatsApp and sending a scheme message or fraud alert.

### 6. Offline and Low-Connectivity Support

Frontend support includes:

- Online/weak/offline indicator
- IndexedDB cache
- Pending sync queue
- Offline trust packs
- Clear offline labeling

### 7. Proof Receipt

Users can view and share a proof receipt with:

- Verdict
- Confidence
- Checked claim
- Primary source
- QR code
- Timestamp

---

## API Surface

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/health` | Service health |
| `GET` | `/api/demo-claims` | Demo claims |
| `GET` | `/api/sources` | Active trusted sources |
| `POST` | `/api/verify` | Verify typed claim |
| `GET` | `/api/verification/{id}` | Fetch a verification result |
| `POST` | `/api/ocr` | OCR image and verify extracted text |
| `GET` | `/api/evidence/{chunk_id}` | Evidence detail |
| `POST` | `/api/stt` | Speech to text |
| `POST` | `/api/tts` | Text to speech |
| `POST` | `/api/translate` | Translate text |
| `POST` | `/api/voice-agent` | End-to-end voice verification |
| `POST` | `/api/reports` | Submit community report |
| `POST` | `/api/sync` | Sync offline queue |
| `POST` | `/api/twilio/whatsapp` | Twilio WhatsApp webhook |
| `POST` | `/api/ivr/voice` | Twilio voice IVR |
| `GET` | `/api/ivr/health` | IVR health |

---

## Local Setup

### Backend

```bash
cd backend
python3.11 -m venv venv
./venv/bin/pip install -r requirements.txt
cp .env.example .env
./venv/bin/python run.py
```

Backend runs at:

```text
http://localhost:8001
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Frontend runs at:

```text
http://localhost:3000
```

---

## Environment Variables

### Backend

```env
APP_ENV=development
CORS_ORIGINS=http://localhost:3000

DATABASE_URL=sqlite:///./satyasetu.db
VECTOR_DATABASE_URL=

SARVAM_API_KEY=
SARVAM_STT_MODEL=saaras:v3
SARVAM_TTS_MODEL=bulbul:v3

LLM_API_KEY=
LLM_PROVIDER=anthropic
LLM_MODEL=claude-sonnet-5

EMBEDDING_API_KEY=
EMBEDDING_PROVIDER=local

MAX_UPLOAD_MB=8
UPLOAD_RETENTION_HOURS=24

WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=
WHATSAPP_API_VERSION=v21.0

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_PUBLIC_BASE_URL=
TWILIO_VALIDATE_WEBHOOKS=true
```

### Frontend

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001
```

Never expose server-side keys such as `SARVAM_API_KEY`, `LLM_API_KEY`, Twilio auth tokens, or WhatsApp access tokens to the frontend.

---

## Demo Claims

`GET /api/demo-claims` returns seeded claims across:

- Government schemes
- Financial scams
- Health misinformation
- Education claims
- Identity/Aadhaar-related claims
- Cybercrime reporting

Seeded official domains include:

- `pmkisan.gov.in`
- `rbi.org.in`
- `mohfw.gov.in`
- `uidai.gov.in`
- `scholarships.gov.in`
- `cybercrime.gov.in`
- `education.gov.in`
- `who.int`
- `pib.gov.in`

The demo corpus uses real official domains. Some document content is curated/paraphrased for stable hackathon demos rather than live crawled on every request.

---

## Testing

Run backend tests:

```bash
cd backend
./venv/bin/python -m pytest
```

Run frontend production build:

```bash
cd frontend
npm run build
```

Current verified status:

- Backend tests: `14 passed`
- Frontend build: passing
- `/api/verify`: returns evidence-backed verdicts
- `/api/tts`: returns Sarvam audio when configured
- Hindi verification path: translates for source matching and returns official evidence

---

## Deployment Notes

### Frontend

Deploy the `frontend/` directory to Vercel or any Next.js-compatible platform.

Set:

```env
NEXT_PUBLIC_API_BASE_URL=https://YOUR-BACKEND-HOST
```

### Backend

Deploy the `backend/` directory to a Python/FastAPI host such as Render, Railway, Fly.io, AWS, GCP, Azure, or a government-controlled environment.

Production recommendations:

- Use Postgres instead of local SQLite.
- Store secrets in the hosting provider's secret manager.
- Keep CORS restricted to trusted frontend origins.
- Use HTTPS for voice, WhatsApp, and IVR callbacks.
- Replace in-memory rate limiting with Redis for multi-instance deployments.
- Add structured logging and request IDs.
- Add observability for external provider latency and failure rates.
- Keep webhook signature validation enabled.

---

## Twilio Voice Helpline

SatyaSetu includes a multilingual IVR flow for people who cannot or do not want to use the web app.

Setup:

1. Copy Twilio variables from `backend/.env.example` into `backend/.env`.
2. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER`.
3. Expose the backend over HTTPS.
4. Set `TWILIO_PUBLIC_BASE_URL` to that HTTPS origin.
5. Configure the Twilio phone number's incoming call webhook:

```text
POST https://YOUR-HOST/api/ivr/voice
```

6. Confirm:

```text
GET /api/ivr/health
```

---

## WhatsApp Sandbox

The frontend WhatsApp page opens the sandbox chat:

```text
https://wa.me/14155238886
```

Backend webhook support exists for Twilio WhatsApp:

```text
POST /api/twilio/whatsapp
```

Configure the Twilio WhatsApp Sandbox "When a message comes in" webhook to your public backend URL.

---

## Security and Privacy

- API keys stay server-side.
- Uploaded screenshots are handled for verification and should not be exposed publicly.
- Community reports are only signals. They never decide whether a claim is true or false.
- Offline results are labeled clearly and include saved/update context.
- Webhook signature validation should remain enabled outside local development.
- Final verdict logic is centralized in `backend/app/verification/engine.py`.

---

## Design Principles

- Simple language for citizens.
- Official proof over generated confidence.
- No silent false labels.
- No AI-only verdicts.
- Clear source trail.
- Useful in low-connectivity environments.
- Voice-first access for low digital literacy users.

---

## Useful Commands

```bash
# Backend
cd backend
./venv/bin/python run.py
./venv/bin/python -m pytest

# Frontend
cd frontend
npm run dev
npm run build
```

---

## License

Add the intended project license before public production release.
