"""
Scraper Nexus API — FastAPI entry point.

LOCAL:
    cd scraper-nexus-main
    python -m uvicorn backend.main:app --reload --port 8000

RENDER (production):
    Set start command: uvicorn backend.main:app --host 0.0.0.0 --port $PORT
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .database import init_db, close_db
from .routes import dashboard, categories, products, scraper, logs, analytics, schedules

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s  %(name)s  %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Scraper Nexus API...")
    await init_db()
    from .routes.schedules import start_scheduler
    start_scheduler()
    logger.info("Auto-scrape scheduler started.")
    yield
    await close_db()
    logger.info("Scraper Nexus API shut down.")


app = FastAPI(title="Scraper Nexus API", version="3.0.0", lifespan=lifespan)

# ── CORS — uses env var CORS_ORIGINS for production ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──
app.include_router(dashboard.router,   prefix="/api", tags=["Dashboard"])
app.include_router(categories.router,  prefix="/api", tags=["Categories"])
app.include_router(products.router,    prefix="/api", tags=["Products"])
app.include_router(scraper.router,     prefix="/api", tags=["Scraper"])
app.include_router(logs.router,        prefix="/api", tags=["Logs"])
app.include_router(analytics.router,   prefix="/api", tags=["Analytics"])
app.include_router(schedules.router,   prefix="/api", tags=["Schedules"])

# ── WebSocket ──
from .routes.logs import websocket_logs
app.websocket("/ws/logs")(websocket_logs)


@app.get("/")
async def root():
    return {"message": "Scraper Nexus API is running"}


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})
