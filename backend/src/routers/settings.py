import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import yaml
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, field_validator

from src.config import get_config, load_config

router = APIRouter(tags=["settings"])


def _require_admin(x_admin_key: str | None):
    """
    Raise 403 unless the caller provides a valid admin key.

    Admin key resolution order:
      1. ADMIN_API_KEY env var (dedicated admin secret)
      2. API_KEY env var (falls back to the regular key when no dedicated admin key is set)
      3. If neither is configured, admin actions are unrestricted (local dev)
    """
    admin_key = (
        os.environ.get("ADMIN_API_KEY", "").strip()
        or os.environ.get("API_KEY", "").strip()
    )
    if not admin_key:
        return  # auth disabled — local dev
    if x_admin_key != admin_key:
        raise HTTPException(status_code=403, detail="Forbidden — valid X-Admin-Key required.")


@router.get("/settings")
async def get_settings():
    cfg = get_config()
    return {
        "provider": cfg.provider,
        "api_key_set": bool(cfg.api_key),
        "model": cfg.model,
        "context_window_tokens": cfg.context_window_tokens,
        "max_chunk_tokens": cfg.max_chunk_tokens,
        "timeouts": cfg.timeouts.model_dump(),
        "temperatures": cfg.temperatures.model_dump(),
        "ollama_base_url": cfg.ollama_base_url,
    }


class SettingsPatch(BaseModel):
    # api_key intentionally excluded — must be set via environment variable
    provider: str | None = None
    model: str | None = None
    context_window_tokens: int | None = None
    max_chunk_tokens: int | None = None
    timeouts: dict | None = None
    temperatures: dict | None = None
    ollama_base_url: str | None = None

    @field_validator("context_window_tokens")
    @classmethod
    def validate_context_window(cls, v: int | None) -> int | None:
        if v is not None and not (1000 <= v <= 2_000_000):
            raise ValueError("context_window_tokens must be between 1 000 and 2 000 000")
        return v

    @field_validator("max_chunk_tokens")
    @classmethod
    def validate_max_chunk(cls, v: int | None) -> int | None:
        if v is not None and not (100 <= v <= 500_000):
            raise ValueError("max_chunk_tokens must be between 100 and 500 000")
        return v

    @field_validator("timeouts")
    @classmethod
    def validate_timeouts(cls, v: dict | None) -> dict | None:
        if v is None:
            return v
        chunk = v.get("chunk_call_seconds")
        synth = v.get("synthesis_seconds")
        if chunk is not None and not (5 <= int(chunk) <= 600):
            raise ValueError("chunk_call_seconds must be between 5 and 600")
        if synth is not None and not (5 <= int(synth) <= 600):
            raise ValueError("synthesis_seconds must be between 5 and 600")
        return v

    @field_validator("temperatures")
    @classmethod
    def validate_temperatures(cls, v: dict | None) -> dict | None:
        if v is None:
            return v
        for key in ("scanning", "synthesis"):
            val = v.get(key)
            if val is not None and not (0.0 <= float(val) <= 2.0):
                raise ValueError(f"temperatures.{key} must be between 0.0 and 2.0")
        return v


@router.patch("/settings")
async def patch_settings(
    body: SettingsPatch,
    x_admin_key: str | None = Header(default=None),
):
    _require_admin(x_admin_key)

    config_path = Path(os.environ.get("CONFIG_PATH", "/data/config/config.yaml"))

    try:
        with open(config_path, "r") as f:
            raw = yaml.safe_load(f) or {}
    except FileNotFoundError:
        raw = {}

    update = body.model_dump(exclude_none=True)
    raw.update(update)

    with open(config_path, "w") as f:
        yaml.dump(raw, f, default_flow_style=False)

    # Reload config into memory
    load_config()

    print(
        f"[{datetime.now(timezone.utc).isoformat()}] settings updated: {list(update.keys())}",
        file=sys.stderr,
    )

    return {"ok": True}
