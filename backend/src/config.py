"""
YAML configuration loader.

Reads /data/config/config.yaml (or CONFIG_PATH env var).
Supports api_key: "ENV:MY_VAR" to pull secrets from environment variables.
"""

import os
import re
from functools import lru_cache
from pathlib import Path

import yaml
from pydantic import BaseModel, field_validator


class TimeoutsConfig(BaseModel):
    chunk_call_seconds: int = 60
    synthesis_seconds: int = 120


class TemperaturesConfig(BaseModel):
    scanning: float = 0.1
    synthesis: float = 0.2


class AppConfig(BaseModel):
    provider: str
    api_key: str = ""  # optional for providers that don't require a key (e.g. Ollama)
    model: str
    context_window_tokens: int = 128000
    max_chunk_tokens: int = 24000
    timeouts: TimeoutsConfig = TimeoutsConfig()
    temperatures: TemperaturesConfig = TemperaturesConfig()
    ollama_base_url: str = "http://host.docker.internal:11434"

    @field_validator("provider")
    @classmethod
    def validate_provider(cls, v: str) -> str:
        allowed = {"openai", "anthropic", "google", "ollama"}
        if v not in allowed:
            raise ValueError(f"provider must be one of {allowed}, got '{v}'")
        return v


_config: AppConfig | None = None


def _resolve_env(value: str) -> str:
    """Resolve 'ENV:VAR_NAME' references to actual environment variable values."""
    match = re.fullmatch(r"ENV:(\w+)", value.strip())
    if match:
        var = match.group(1)
        resolved = os.environ.get(var)
        if not resolved:
            raise RuntimeError(
                f"Config references environment variable '{var}' but it is not set."
            )
        return resolved
    return value


def load_config() -> AppConfig:
    global _config
    config_path = Path(os.environ.get("CONFIG_PATH", "/data/config/config.yaml"))

    if not config_path.exists():
        raise RuntimeError(
            f"Config file not found at {config_path}. "
            "Copy config.example.yaml to /data/config/config.yaml and edit it."
        )

    with open(config_path, "r") as f:
        raw = yaml.safe_load(f)

    if not isinstance(raw, dict):
        raise RuntimeError("config.yaml must be a YAML mapping.")

    # Resolve ENV references
    if "api_key" in raw:
        raw["api_key"] = _resolve_env(str(raw["api_key"]))

    _config = AppConfig(**raw)
    return _config


def get_config() -> AppConfig:
    if _config is None:
        return load_config()
    return _config
