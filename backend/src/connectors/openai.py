import tiktoken
from openai import AsyncOpenAI

from src.connectors.base import LLMConnector


class OpenAIConnector(LLMConnector):
    def __init__(self, cfg):
        self._client = AsyncOpenAI(api_key=cfg.api_key)
        self._model = cfg.model
        try:
            self._enc = tiktoken.encoding_for_model(cfg.model)
        except KeyError:
            self._enc = tiktoken.get_encoding("cl100k_base")

    async def complete(self, prompt: str, system: str, temperature: float, timeout: float) -> tuple[str, dict]:
        response = await self._client.chat.completions.create(
            model=self._model,
            messages=[{"role": "system", "content": system}, {"role": "user", "content": prompt}],
            temperature=temperature,
            timeout=timeout,
        )
        text = response.choices[0].message.content or ""
        usage = {}
        if response.usage:
            usage = {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens,
            }
        return text, usage

    def count_tokens(self, text: str) -> int:
        return len(self._enc.encode(text))
