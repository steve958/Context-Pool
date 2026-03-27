import asyncio
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.routers import workspaces, documents, query, settings, ws, history
from src.middleware.auth import APIKeyMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: validate config, ensure data directories exist
    from src.config import load_config
    from src.services.storage import ensure_data_dirs
    from src.services.pipeline import RunRegistry
    from src.services.run_repository import RunRepository
    load_config()
    ensure_data_dirs()
    RunRepository.ensure_dirs()

    # Background task: purge stale completed runs every hour
    async def _cleanup_loop():
        while True:
            await asyncio.sleep(3600)
            RunRegistry.cleanup_old_runs()

    task = asyncio.create_task(_cleanup_loop())
    yield
    # Shutdown: cancel background cleanup task
    task.cancel()


app = FastAPI(
    title="Context Pool API",
    description="Sequential exhaustive document Q&A without embeddings.",
    version="1.0.0",
    lifespan=lifespan,
)

# SEC-01: API key authentication (no-op when API_KEY env var is not set)
app.add_middleware(APIKeyMiddleware)

# SEC-03: CORS origins from environment variable (comma-separated list)
_raw_origins = os.environ.get("CORS_ORIGINS", "http://localhost:3000")
_cors_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "X-API-Key"],
)

app.include_router(workspaces.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(query.router, prefix="/api")
app.include_router(settings.router, prefix="/api")
app.include_router(ws.router)
app.include_router(history.router, prefix="/api")


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """
    Catch-all for any unhandled exception in a route handler.
    Returning a JSONResponse here keeps the response inside the middleware
    stack, so CORSMiddleware can attach Access-Control-Allow-Origin headers.
    Without this, unhandled exceptions propagate past CORSMiddleware and the
    browser sees a response with no CORS headers and blocks it.
    """
    return JSONResponse(
        status_code=500,
        content={"error": str(exc) or f"{type(exc).__name__} (no detail)"},
    )


@app.get("/health")
async def health():
    return {"status": "ok"}
