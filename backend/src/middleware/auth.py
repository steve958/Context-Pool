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
            return await call_next(request)

        # WebSocket upgrades are authenticated separately (query param)
        if request.headers.get("upgrade", "").lower() == "websocket":
            return await call_next(request)

        # Exempt paths
        if any(request.url.path.startswith(p) for p in _EXEMPT_PREFIXES):
            return await call_next(request)

        provided = request.headers.get("X-API-Key", "").strip()
        if provided != self._key:
            return JSONResponse(
                status_code=401,
                content={"error": "Unauthorized — provide a valid X-API-Key header."},
            )

        return await call_next(request)
