# AI Agent Dashboard 2026

A modern, real-time analytics dashboard designed for developers and AI engineers to track, visualize, and optimize LLM API usage patterns, token consumption, and costs across multiple AI models (OpenAI, Anthropic, Google Gemini, Azure OpenAI).

---

## ⚡ Key Features

- 📊 **Multi-Model Token & Cost Analytics**: Real-time aggregation of prompt tokens, completion tokens, execution latency, and exact USD spend.
- 🔄 **Multi-Provider Ingestion Engine**:
  - Direct webhook adapters for **OpenAI**, **Anthropic**, and **Google Gemini** payloads.
  - Generic batch JSON ingestion (`POST /api/usage/ingest`).
  - Drag-and-drop / bulk CSV log file upload (`POST /api/usage/ingest/csv`).
- 📈 **Interactive Visualizations (Recharts)**:
  - Token consumption & spend trends over time with daily/hourly granularity and prompt/completion split.
  - Model comparison bar chart with provider-specific theme accents.
  - Cost distribution donut chart and monthly run-rate projection.
- ⚡ **Real-Time Layer**:
  - Live Server-Sent Events (SSE) stream (`/api/usage/events`) pushing instant updates to connected dashboards with automatic polling fallback.
- 🌓 **Modern UI/UX**:
  - Next.js 14 App Router with TypeScript strict mode.
  - Tailwind CSS with responsive desktop/mobile layout and dark mode toggle.
- 🚀 **Production-Ready**:
  - Dockerized frontend and backend with `docker-compose.yml`.
  - GitHub Actions CI/CD pipeline deploying to **Azure App Service** and **Azure Container Registry (ACR)**.

---

## Architecture

```mermaid
graph TD
    subgraph Clients & Ingestion Sources
        A[Coding Assistant / Agent CLI] -->|POST /api/usage/ingest| B(FastAPI Backend)
        C[Anthropic / OpenAI Raw Webhook] -->|POST /api/usage/ingest/provider/:provider| B
        D[CSV Usage Logs] -->|POST /api/usage/ingest/csv| B
    end

    subgraph Backend Engine (Python 3.10 / FastAPI)
        B --> E[Provider Adapter Layer]
        E --> F[Pydantic Normalized Model]
        F --> G[(Database: SQLite / PostgreSQL)]
        B --> H[Real-Time Event Bus]
    end

    subgraph Frontend Dashboard (Next.js 14 / TypeScript)
        I[KPI Metric Cards] <-->|REST API| B
        J[Recharts Time-Series & Bar Charts] <-->|REST API| B
        K[Live Updates Indicator] <-->|SSE /events Stream| H
    end
```

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 14 (App Router), TypeScript (Strict Mode), Tailwind CSS, Lucide React, Recharts |
| **Backend** | Python 3.10+, FastAPI, SQLAlchemy, Pydantic v2, Uvicorn |
| **Database** | SQLite (default local), PostgreSQL (swappable via `DATABASE_URL`) |
| **Real-time** | Server-Sent Events (SSE) with async pub/sub event bus |
| **DevOps & Cloud** | Docker, Docker Compose, GitHub Actions, Azure App Service, Azure Container Registry |

---

## Quick Start (Local Development)

### 🚀 One-Click Launch (Windows)
Double-click `start.bat` (or run `./start.ps1` in PowerShell) in the project root:
- Automatically launches the **FastAPI backend** on port 8000 in its own terminal window.
- Automatically launches the **Next.js frontend** on port 3000 in its own terminal window.
- Automatically opens `http://localhost:3000` in your default browser.

---

### Manual Step-by-Step Launch

#### 1. Backend Setup

```bash
cd backend

# Install dependencies
python -m pip install -r requirements.txt

# Seed realistic mock LLM usage data (790+ records across 3+ weeks)
python seed.py

# Run the FastAPI server
uvicorn app.main:app --reload --port 8000
```

- API Docs (Swagger UI): `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

### 2. Frontend Setup

```bash
cd frontend

# Install packages
npm install

# Run the Next.js development server
npm run dev
```

- Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Running with Docker Compose

To spin up both frontend and backend in containers with a single command:

```bash
docker compose up --build
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`

---

## 💵 USD Cost Normalization Across Providers

> **Standardized Currency Protocol:**
> All cost metrics in this dashboard are **strictly normalized to United States Dollars (`cost_usd`)** regardless of the source LLM provider (OpenAI, Anthropic, Google Gemini, Azure OpenAI) or their native billing currency:
> - **Automatic Cost Derivation:** When token counts are ingested without an explicit cost, the backend uses a centralized 2026 pricing catalog (prompt & completion rates per 1M tokens) to compute the exact cost in USD.
> - **Cross-Provider Comparability:** Storing all usage strictly in USD guarantees that cross-model comparisons (e.g. comparing Claude 3.5 Sonnet vs. GPT-4o vs. Gemini 1.5 Pro) and monthly forecasting equations are mathematically uniform and directly comparable.

---

## API Reference

All ingestion endpoints are protected by the `X-API-Key` header (default: `ai-dash-secret-key-2026`).

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service health status |
| `GET` | `/api/usage/summary` | Aggregated tokens, spend, active models, filterable by date and provider |
| `GET` | `/api/usage/timeseries` | Time-series token and cost data grouped by day or hour |
| `GET` | `/api/usage/by-model` | Per-model breakdown of tokens, costs, and request volume |
| `GET` | `/api/usage/costs` | Spend attribution by provider/project, plus monthly run-rate projection |
| `GET` | `/api/usage/events` | Server-Sent Events (SSE) streaming live usage events |
| `POST` | `/api/usage/ingest` | Batch JSON ingestion of normalized usage records |
| `POST` | `/api/usage/ingest/provider/{provider}` | Direct ingestion of raw provider payloads (`openai`, `anthropic`, `gemini`, `azure_openai`) |
| `POST` | `/api/usage/ingest/csv` | Upload and parse CSV log files |

### Example: Ingesting Usage via cURL

```bash
curl -X POST "http://localhost:8000/api/usage/ingest" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ai-dash-secret-key-2026" \
  -d '{
    "records": [
      {
        "provider": "openai",
        "model": "gpt-4o",
        "input_tokens": 1450,
        "output_tokens": 420,
        "project_tag": "coding-assistant",
        "latency_ms": 780
      }
    ]
  }'
```

---

## Testing

Run the automated backend test suite:

```bash
cd backend
python -m pytest
```

Run frontend type check and build verification:

```bash
cd frontend
npm run type-check
npm run build
```

---

## Cloud Deployment to Azure

Refer to [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step instructions on setting up:
1. Azure Resource Group, App Service Plan, and Web Apps.
2. Azure Container Registry (ACR).
3. GitHub Actions automated CI/CD pipeline (`.github/workflows/deploy-azure.yml`).
