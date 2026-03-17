# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Metropolis (Argus) is a 3D global event intelligence dashboard that visualizes world events on an interactive globe and explains their impact on Canada. It uses a Graph-RAG AI agent powered by Google Gemini, with data from ACLED, Polymarket, and Kalshi.

## Development Commands

### Frontend (React + Vite + TypeScript)
```bash
cd frontend
npm install
npm run dev        # Dev server on localhost:5173
npm run build      # tsc -b && vite build
npm run preview    # Preview production build
```

### Backend (FastAPI + Python)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Interactive API docs at http://localhost:8000/docs

### Database
```bash
psql -U postgres -d your_db -f backend/migrations/001_init_schema.sql
```
Requires PostgreSQL 15+ with `pgvector` and `pgcrypto` extensions.

## Architecture

**Frontend** uses three nested React Context providers:
- `AppProvider` → global events, arcs, filters, timeline state
- `UserPersonaProvider` → user role + industry selection
- `AgentProvider` → agent state, navigation, highlights

Provider nesting order: `AppProvider > UserPersonaProvider > AgentProvider` (see `main.tsx`).

The Vite dev server proxies `/api` requests to `http://127.0.0.1:8000` (configured in `vite.config.ts`).

**Backend** is organized by feature into FastAPI routers:
- `/content` — points, arcs, event detail, real-time analysis
- `/agent` — natural language query processing (Graph-RAG pipeline)
- `/ingestion` — ACLED data ingestion pipeline
- `/embeddings` — vector backfill
- `/market-signals` — Polymarket/Kalshi scraping

**Agent pipeline** (Graph-RAG): query → seed retrieval (keyword + pgvector) → two-hop graph expansion → context assembly → Gemini synthesis with `[cite:UUID]` citations → structured JSON response with navigation plan.

**Database**: PostgreSQL with `content_table` as core table (UUID id, title, body, coordinates, embedding vector(1536), event_type, sentiment). Related tables: `sources`, `engagement`, `entities`, `event_relationships`.

## Key Environment Variables

| Variable | Layer | Purpose |
|---|---|---|
| `DATABASE_URL` | Backend (required) | asyncpg PostgreSQL connection string |
| `GEMINI_API_KEY` | Backend | Gemini API; agent degrades without it |
| `OPENAI_API_KEY` | Backend | pgvector semantic search; falls back to keyword |
| `VITE_API_URL` | Frontend | API base URL; defaults to `/api` (Vite proxy) |
| `VITE_CLOUDINARY_CLOUD_NAME` | Frontend | Cloudinary images; falls back to placeholder SVG |

## Issue Tracking

Uses **bd (beads)** for all task tracking. Do not use markdown TODOs or external trackers. See `AGENTS.md` for full workflow.

## Shell Commands

Always use non-interactive flags (`cp -f`, `mv -f`, `rm -f`) to avoid hanging on confirmation prompts.
