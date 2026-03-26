"""
API Key authentication middleware.

When the API_KEY environment variable is set, all requests must include an
X-API-Key header matching that value.  When API_KEY is unset the middleware
is a no-op (local development convenience).

Exempt paths (never require auth):
  - /health
  - /docs, /openapi.json, /redoc  (FastAPI auto-generated docs)
"""

import os
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse


_EXEMPT_PREFIXES = ("/health", "/docs", "/openapi.json", "/redoc")


class APIKeyMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self._key = os.environ.get("API_KEY", "").strip()

    async def dispatch(self, request: Request, call_next):
        # Auth disabled when no key is configured
        if not self._key:
            return await self._safe_call_next(request, call_next)

        # WebSocket upgrades are authenticated separately (query param)
        if request.headers.get("upgrade", "").lower() == "websocket":
            return await self._safe_call_next(request, call_next)

        # Exempt paths
        if any(request.url.path.startswith(p) for p in _EXEMPT_PREFIXES):
            return await self._safe_call_next(request, call_next)

        provided = request.headers.get("X-API-Key", "").strip()
        if provided != self._key:
            return JSONResponse(
                status_code=401,
                content={"error": "Unauthorized — provide a valid X-API-Key header."},
            )

        return await self._safe_call_next(request, call_next)

    @staticmethod
    async def _safe_call_next(request: Request, call_next):
        """
        BaseHTTPMiddleware re-raises route exceptions through call_next, which
        causes them to escape CORSMiddleware before the global exception handler
        can catch them — resulting in CORS-less 500 responses in the browser.
        Catching here and converting to JSONResponse keeps the error inside the
        middleware stack so CORSMiddleware can attach its headers.
        """
        try:
            return await call_next(request)
        except Exception as exc:
            return JSONResponse(
                status_code=500,
                content={"error": str(exc) or f"{type(exc).__name__} (no detail)"},
            )
