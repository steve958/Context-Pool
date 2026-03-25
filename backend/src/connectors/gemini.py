import google.generativeai as genai
import tiktoken

from src.connectors.base import LLMConnector

# Gemini uses SentencePiece internally. tiktoken cl100k_base gives a close
# approximation without requiring a synchronous API call per chunk.
_enc = tiktoken.get_encoding("cl100k_base")


class GeminiConnector(LLMConnector):
    def __init__(self, cfg):
        genai.configure(api_key=cfg.api_key)
        self._model_name = cfg.model

    async def complete(self, prompt: str, system: str, temperature: float, timeout: float) -> tuple[str, dict]:
        import asyncio
        model = genai.GenerativeModel(
            model_name=self._model_name,
            system_instruction=system,
        )
        config = genai.types.GenerationConfig(temperature=temperature)
        # google-generativeai is sync; run in executor to avoid blocking
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: model.generate_content(prompt, generation_config=config),
        )
        text = response.text or ""
        usage = {}
        meta = getattr(response, "usage_metadata", None)
        if meta:
            usage = {
                "prompt_token_count": getattr(meta, "prompt_token_count", 0),
                "candidates_token_count": getattr(meta, "candidates_token_count", 0),
                "total_token_count": getattr(meta, "total_token_count", 0),
            }
        return text, usage

    def count_tokens(self, text: str) -> int:
        return max(1, len(_enc.encode(text)))
