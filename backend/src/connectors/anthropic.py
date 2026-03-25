import anthropic as sdk
import tiktoken

from src.connectors.base import LLMConnector

# Claude uses a BPE tokenizer closely related to GPT-4's cl100k_base.
# Using tiktoken for accurate, fast, offline token counting.
_enc = tiktoken.get_encoding("cl100k_base")


class AnthropicConnector(LLMConnector):
    def __init__(self, cfg):
        self._client = sdk.AsyncAnthropic(api_key=cfg.api_key)
        self._model = cfg.model

    async def complete(self, prompt: str, system: str, temperature: float, timeout: float) -> tuple[str, dict]:
        response = await self._client.messages.create(
            model=self._model,
            max_tokens=4096,
            system=system,
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
            timeout=timeout,
        )
        text = response.content[0].text if response.content else ""
        usage = {}
        if response.usage:
            usage = {
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens,
            }
        return text, usage

    def count_tokens(self, text: str) -> int:
        return max(1, len(_enc.encode(text)))
