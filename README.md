# StudyMate AI — CTRL + KNOWLEDGE

**Hacktoberfest HackDay 2026 — Track 1, Problem Statement 01**

An evidence-grounded AI study assistant built by **CTRL + KNOWLEDGE** that enables students to upload course notes or textbooks, ask questions with real page citations, take multiple-choice quizzes evaluated deterministically in Python, and master topics through interactive flashcards and persistent gamification.

---

## 1. Key Features

- **Document Ingestion**: Upload multi-page PDF documents or paste text notes directly.
- **Page-by-Page Extraction**: Powered by `PyMuPDF` (`pymupdf`), maintaining exact page numbers and document names across segmented chunks.
- **Strict Evidence-Grounded Answering**: Utilizes the verified **Gemma 4** model (`gemma-4-26b-a4b-it`) via Google GenAI SDK instructed strictly to answer from retrieved passages.
- **Zero-Hallucination & Out-of-Syllabus Guard**: If the material does not cover a topic, StudyMate AI clearly flags it as `Out of Syllabus: Not Found in Notes` rather than fabricating citations or answers.
- **Verifiable Citations**: Every answer displays the verbatim source passage, matching page number, and keyword relevance score.
- **Knowledge Quizzes**: Gemma 4 generates multiple-choice quizzes with strict 4-option validation, verified answer keys, and source citations.
- **Deterministic Python Answer Evaluation**: Answers are scored and verified strictly in Python against backend-stored answer keys—never by asking an LLM to guess.
- **XP, Levels & Badges**: Students earn persistent XP across Beginner, Learner, Explorer, Scholar, and Expert tiers, with 6 achievement badges stored persistently on disk.
- **Topic Mastery Map**: Real-time curriculum mastery scoring (Strong, Improving, Needs Revision) with mistake reviews and interactive flashcards.

---

## 2. Technology Stack & Architecture

- **Backend (Single Authoritative API)**: Python 3.10+, FastAPI, Uvicorn, Pydantic, PyMuPDF.
  - Runs on port `8001` (e.g. `http://127.0.0.1:8001`).
- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Vite.
  - Runs on port `3000` (e.g. `http://localhost:3000`).
  - Proxies all `/upload-notes`, `/ask-question`, `/generate-quiz`, `/evaluate-answer`, `/sessions`, `/health`, and `/student` calls to the FastAPI backend on port `8001`.
- **AI Model**: Gemma 4 (`gemma-4-26b-a4b-it`) configured with `api_version: "v1alpha"` via the official Google GenAI Python SDK (`google-genai`).
- **Storage**:
  - In-memory thread-safe session store for fast retrieval and hidden answer keys.
  - Disk-backed persistent JSON store (`data/student_profile.json`) for XP, levels, study days, mistakes, and badges.

---

## 3. Project Directory Structure

```
├── backend/
│   ├── __init__.py
│   ├── ai_service.py       # Gemma 4 integration for Q&A, quiz generation, and flashcards
│   ├── gamification.py     # Levels, XP, badge rules, and profile disk persistence
│   ├── main.py             # Authoritative FastAPI API service
│   ├── models.py           # Pydantic schemas (requests, responses, citations)
│   ├── pdf_processor.py    # PyMuPDF text extractor and chunking
│   ├── retrieval.py        # Keyword search and evidence classification
│   ├── session_store.py    # In-memory session and answer-key store
│   └── tests/
│       ├── test_step1.py   # PDF extraction, retrieval, and upload tests
│       └── test_step2_3.py # Q&A, quiz validation, and evaluation tests
├── src/                    # React frontend application
│   ├── App.tsx             # Main view router and session management
│   ├── components/         # Reusable UI components (LevelProgressBar, Badges, Mastery)
│   ├── screens/
│   │   ├── UploadScreen.tsx    # Home and file upload screen
│   │   ├── WorkspaceScreen.tsx # Q&A interface with source citations
│   │   ├── QuizScreen.tsx      # Step-by-step quiz with answer evaluation
│   │   └── MasteryScreen.tsx   # Topic mastery map and achievements
│   ├── services/
│   │   └── api.ts          # API client communicating via Vite proxy to FastAPI
│   ├── types/
│   │   └── index.ts        # TypeScript data definitions
│   └── utils/
│       ├── gamification.ts # Frontend level and mastery calculation helpers
│       └── gamification.test.ts # Node test runner unit tests
├── data/
│   └── student_profile.json # Persistent disk storage for student XP and achievements
├── sample-notes/
│   ├── cellular_respiration.txt     # Sample plain text study notes
│   └── mitosis_and_cell_cycle.pdf   # Real 2-page test PDF
├── .env.example            # Environment variables template (no secrets)
├── requirements.txt        # Python backend dependencies
├── package.json            # Node.js scripts and frontend dependencies
├── vite.config.ts          # Vite configuration with proxy to FastAPI on port 8001
└── server.ts.retired       # Retired TypeScript server (FastAPI is now sole authoritative API)
```

---

## 4. API Specification

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Health check verifying FastAPI service, team branding, and configured Gemma 4 model. |
| `POST` | `/upload-notes` | Accepts PDF file upload or text notes; returns `session_id`, page count, and chunk previews. |
| `POST` | `/ask-question` | Retrieves relevant passages, validates evidence sufficiency, and generates an answer via Gemma 4. |
| `POST` | `/generate-quiz` | Generates 3–10 multiple-choice questions with strict 4-option validation; stores answer keys securely on backend. |
| `POST` | `/evaluate-answer` | Evaluates student choice deterministically in Python; returns correctness, explanation, and source citation. |
| `GET` | `/sessions/{id}` | Retrieves session metadata and indexed passage count. |
| `GET` | `/student/profile` | Retrieves student level, total XP, study days, achievement badges, and topic mastery. |
| `POST` | `/student/record-quiz` | Validates and records quiz results, prevents duplicate XP, updates mastery scores, and unlocks badges. |
| `POST` | `/student/record-revision` | Records daily revision activity and awards daily session XP without duplicates. |
| `POST` | `/student/flashcards` | Generates 5 high-yield interactive study flashcards grounded in syllabus content. |

---

## 5. Getting Started & Installation

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+ and pip / venv
- A Google GenAI API key with access to Gemma 4

### 1. Environment Setup
```bash
cp .env.example .env
```
Configure your environment variables in `.env`:
```env
GEMINI_API_KEY="your_api_key_here"
GEMMA_MODEL="gemma-4-26b-a4b-it"
BACKEND_PORT=8001
```

### 2. Dependency Installation
```bash
# Set up Python virtual environment and install backend requirements
python3 -m venv .venv
.venv/bin/pip install --upgrade pip
.venv/bin/pip install -r requirements.txt

# Install frontend dependencies
npm install
```

### 3. Startup Commands
Run both the FastAPI backend (port 8001) and Vite frontend (port 3000) concurrently:
```bash
npm run dev
```

Or run services independently:
```bash
# Terminal 1: FastAPI Backend
npm run backend
# Equivalent to: PYTHONPATH=. .venv/bin/uvicorn backend.main:app --host 127.0.0.1 --port 8001 --reload

# Terminal 2: Vite Frontend
npx vite --host 0.0.0.0 --port 3000
```

Open your browser to:
```
http://localhost:3000
```

---

## 6. Automated Testing

### 1. Backend Pytest Suite
```bash
npm run test:backend
# Or directly:
PYTHONPATH=. .venv/bin/pytest -v backend/tests/
```
Tests cover:
- Real PDF extraction and page-number preservation using PyMuPDF.
- Error handling on corrupted and empty files.
- Keyword retrieval scoring and "Not Found" thresholding.
- Out-of-syllabus query detection.
- Deterministic Python answer evaluation.
- Live Gemma 4 Q&A and strictly validated quiz generation.

### 2. Frontend TypeScript Verification
```bash
npm run lint
# Runs: tsc --noEmit
```

### 3. Frontend Production Build
```bash
npm run build
# Runs: vite build
```

---

## 7. Known Limitations & Realities

1. **In-Memory Session Persistence**:
   Uploaded study notes and active quiz answer keys are stored in an in-memory dictionary for high-performance session isolation. Restarting the backend server process resets active uploaded sessions. Student profiles, XP, level progression, and achievement badges are persisted separately on disk (`data/student_profile.json`).
2. **Digital Text vs. Scanned PDF Documents**:
   Text extraction uses PyMuPDF (`fitz`), which extracts digital text streams directly from PDF documents. Scanned image-only PDFs (photographs or rasterized document scans without an embedded text layer) require an external OCR pre-processing step before ingestion.
3. **Model Availability & Latency**:
   Gemma 4 (`gemma-4-26b-a4b-it`) is an instruction-tuned 26-billion parameter open-weights model hosted on Google Cloud preview endpoints. Requests require active network connectivity and may take 5–15 seconds to synthesize comprehensive multi-question quizzes.
