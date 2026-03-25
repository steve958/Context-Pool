"""TXT and Markdown passthrough normalizer."""


def parse(content: bytes) -> str:
    text = content.decode("utf-8", errors="replace")
    return text
