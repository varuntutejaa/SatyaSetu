# SatyaSetu — "Evidence before belief."

Trustworthy digital information verification for rural and low-digital-literacy communities.
SatyaSetu never asks users to trust an AI's opinion — it retrieves evidence from a curated
registry of official sources, compares the claim against that evidence, and shows the user
the evidence itself.

**Pipeline:** `CLAIM → TRUSTED SOURCES → EVIDENCE → COMPARISON → VERDICT → SIMPLE EXPLANATION`

## Status

- ✅ **Backend** — FastAPI verification pipeline, RAG retrieval, deterministic verification
  engine, trusted-source registry, OCR, voice (Sarvam) and translation endpoints, sync queue,
  community reporting. Tested end-to-end against 7 real demo claims.
- 🚧 **Frontend** — Next.js PWA (in progress).

## Architecture

```
/backend   FastAPI + SQLAlchemy + deterministic verification engine
  /app/providers      LLMProvider / EmbeddingProvider / OCRProvider / SpeechProvider / TTSProvider
                       interfaces, so Sarvam/Anthropic/etc. can be swapped without touching
                       business logic
  /app/rag             Vector retrieval + source-authority-aware ranking
  /app/verification     The single place a verdict is decided — never the LLM
  /app/database/seed.py Curated trusted-source registry + demo corpus (real official domains)

/frontend  Next.js 15 + TypeScript + Tailwind, PWA (offline-first, IndexedDB sync queue)
```

## Why a "deterministic verification engine"?

The LLM/rule-based comparator only labels each piece of retrieved evidence
SUPPORTS / CONTRADICTS / NEUTRAL. The final verdict (VERIFIED / UNVERIFIED / CONTRADICTED)
is decided by fixed rules in `app/verification/engine.py`, based on source authority level,
evidence relevance, and freshness — never by the LLM's own opinion. This is what prevents
"no evidence found" from ever silently becoming "false".

## Backend: local setup

```bash
cd backend
python3.11 -m venv venv
./venv/bin/pip install -r requirements.txt
cp .env.example .env
./venv/bin/python run.py   # http://localhost:8001
```

No API keys are required to run the full pipeline: without `SARVAM_API_KEY` the voice
endpoints return a clean "unavailable, type instead" response; without `LLM_API_KEY` a
deterministic rule-based comparator is used instead of an LLM (both implement the same
`LLMProvider` interface). Without a `DATABASE_URL` pointing at Postgres, SQLite is used with
an in-process cosine-similarity vector search — same schema, swappable later by just changing
`DATABASE_URL` to a Postgres+pgvector connection string.

### Demo claims

`GET /api/demo-claims` returns 7 real, carefully-worded claims spanning government schemes,
financial scams, healthcare misinformation, and education — each backed by a real official
source domain (pmkisan.gov.in, rbi.org.in, mohfw.gov.in, uidai.gov.in, scholarships.gov.in,
cybercrime.gov.in, education.gov.in, who.int, pib.gov.in). None of these are fabricated URLs —
only real, stable, official domains are used. The document *content* is a curated paraphrase
of well-established public information for demo purposes, not a live crawl.

## Privacy & data minimization

- Uploaded screenshots are processed in memory for OCR and never written to disk.
- Sarvam/LLM API keys are read only from server-side environment variables — never exposed
  to the frontend or committed to the repo (see `backend/.env.example`).
- Community reports are signals only; report counts are never used to declare a claim true
  or false.
