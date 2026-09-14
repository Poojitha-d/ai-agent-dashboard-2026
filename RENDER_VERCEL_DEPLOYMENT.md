# Deploying to Render & Vercel Guide

This guide walks you through deploying the **AI Agent Dashboard 2026** to **Render** (for the FastAPI backend) and **Vercel** (for the Next.js frontend), or deploying both entirely on Render using the included `render.yaml` Blueprint.

---

## 🏗️ Deployment Architecture

| Component | Recommended Platform | Why? |
| :--- | :--- | :--- |
| **Backend (FastAPI)** | **Render** | Persistent Python process, SQLite/PostgreSQL support, native Server-Sent Events (SSE) streaming. |
| **Frontend (Next.js)** | **Vercel** or **Render** | Vercel provides world-class Next.js edge caching and instant previews. Render can also host both together. |

---

## Method 1: Deploy Both to Render in 1 Click (Blueprint)

We have already configured [`render.yaml`](file:///C:/Projects/AI%20Agent%20Dashboard%202026/render.yaml) in the project root.

### Steps:
1. **Push your code to GitHub**:
   - Create a repository on [github.com](https://github.com) named `ai-agent-dashboard-2026`.
   - Push your code to the repository (using GitHub Desktop, VS Code Git, or Git CLI).
2. **Deploy on Render**:
   - Go to [dashboard.render.com](https://dashboard.render.com) and log in.
   - Click **New +** > **Blueprint**.
   - Connect your GitHub repository.
   - Render will detect `render.yaml` and automatically configure:
     - `ai-agent-dashboard-api` (Python FastAPI service)
     - `ai-agent-dashboard-frontend` (Next.js service)
   - Click **Apply** to deploy!

---

## Method 2: Deploy Frontend to Vercel + Backend to Render

### Step 1: Deploy Backend to Render
1. Go to [dashboard.render.com](https://dashboard.render.com) > **New +** > **Web Service**.
2. Select your repository.
3. Configure settings:
   - **Name**: `ai-agent-dashboard-api`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt && python seed.py`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: `Free`
4. Under **Environment Variables**, add:
   - `DATABASE_URL` = `sqlite:///./usage.db`
   - `API_KEY` = `ai-dash-secret-key-2026`
   - `CORS_ORIGINS` = `["*"]`
5. Click **Create Web Service**. Once deployed, copy your backend URL (e.g. `https://ai-agent-dashboard-api.onrender.com`).

---

### Step 2: Deploy Frontend to Vercel

#### Option 2A: Via Vercel Web Dashboard (Easiest)
1. Go to [vercel.com/new](https://vercel.com/new) and log in.
2. Select your GitHub repository.
3. In the project configuration:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click edit and select `frontend`.
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL` = Your Render backend URL (e.g. `https://ai-agent-dashboard-api.onrender.com`).
5. Click **Deploy**!

#### Option 2B: Via Vercel CLI (Direct from Windows)
Double-click [`deploy-vercel.bat`](file:///C:/Projects/AI%20Agent%20Dashboard%202026/deploy-vercel.bat) in the project root or run:
```bash
cd frontend
npx vercel
```
1. Follow the one-time browser login prompt.
2. Accept the default settings (it automatically detects Next.js).
3. Set the environment variable `NEXT_PUBLIC_API_URL` to your live backend URL.
4. Run `npx vercel --prod` to deploy to production.
