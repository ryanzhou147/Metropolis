import logging
import os

from dotenv import load_dotenv

load_dotenv()  # Load .env so DATABASE_URL is available for scraper persist

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import ingestion, embeddings, market_signals, content, agent

logger = logging.getLogger(__name__)

_default_origins = "http://localhost:5173,http://127.0.0.1:5173"
_raw = os.getenv("ALLOWED_ORIGINS", _default_origins)
allowed_origins = [o.strip() for o in _raw.split(",") if o.strip()]

if not allowed_origins:
    logger.warning("ALLOWED_ORIGINS is empty — no origins will be permitted by CORS")
elif "*" in allowed_origins:
    logger.warning("ALLOWED_ORIGINS contains '*' wildcard — this defeats CORS protection")
else:
    logger.info("CORS allowed origins: %s", allowed_origins)

app = FastAPI(
    title="Global Event Intelligence API",
    description="Read-only API serving global events and their impact on Canada.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(market_signals.router)
app.include_router(ingestion.router)
app.include_router(embeddings.router)
app.include_router(content.router)
app.include_router(agent.router)


@app.get("/health")
def health():
    return {"status": "ok"}
