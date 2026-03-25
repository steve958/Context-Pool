import httpx

from src.connectors.base import LLMConnector


class OllamaConnector(LLMConnector):
    def __init__(self, cfg):
        self._base_url = cfg.ollama_base_url
        self._model = cfg.model

    async def complete(self, prompt: str, system: str, temperature: float, timeout: float) -> tuple[str, dict]:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                f"{self._base_url}/api/chat",
                json={
                    "model": self._model,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": prompt},
                    ],
                    "options": {"temperature": temperature},
                    "format": "json",
                    "stream": False,
                },
            )
            response.raise_for_status()
            data = response.json()
            text = data.get("message", {}).get("content", "")
            usage = {
                "prompt_tokens": data.get("prompt_eval_count", 0),
                "completion_tokens": data.get("eval_count", 0),
            }
            return text, usage

    def count_tokens(self, text: str) -> int:
        # Use Ollama's /api/tokenize for model-native token counts.
        # Falls back to char-based estimate if Ollama is unreachable.
        try:
            with httpx.Client(timeout=10.0) as client:
                r = client.post(
                    f"{self._base_url}/api/tokenize",
                    json={"model": self._model, "content": text},
                )
                r.raise_for_status()
                tokens = r.json().get("tokens", [])
                return max(1, len(tokens))
        except Exception:
            return max(1, len(text) // 4)
