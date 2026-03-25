"""
Hybrid chunker: heading-based primary, token-window fallback.
"""

import re
import uuid
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from src.connectors.base import LLMConnector


def chunk_markdown(text: str, doc_id: str, max_tokens: int, connector: "LLMConnector") -> list[dict]:
    sections = _split_by_headings(text)
    chunks: list[dict] = []
    for section in sections:
        token_count = connector.count_tokens(section["text"])
        if token_count <= max_tokens:
            chunks.append({
                "chunk_id": str(uuid.uuid4()),
                "doc_id": doc_id,
                "text": section["text"],
                "heading_path": section["heading_path"],
                "page_marker": section.get("page_marker"),
            })
        else:
            for sub in _split_by_tokens(section, max_tokens, connector, doc_id):
                chunks.append(sub)
    return chunks


def _split_by_headings(text: str) -> list[dict]:
    heading_re = re.compile(r"^(#{1,6})\s+(.+)$", re.MULTILINE)
    page_re = re.compile(r"^---\s*page\s*(\d+)\s*---$", re.MULTILINE)

    matches = list(heading_re.finditer(text))
    if not matches:
        return [{"text": text, "heading_path": "", "page_marker": _last_page_marker(text, 0, page_re)}]

    sections = []
    heading_stack: list[tuple[int, str]] = []

    for i, m in enumerate(matches):
        level = len(m.group(1))
        title = m.group(2).strip()
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        body = text[start:end]

        # Maintain heading stack
        heading_stack = [(l, t) for l, t in heading_stack if l < level]
        heading_stack.append((level, title))
        heading_path = " > ".join(t for _, t in heading_stack)

        sections.append({
            "text": body,
            "heading_path": heading_path,
            "page_marker": _last_page_marker(text, start, page_re),
        })

    # Preamble before first heading
    if matches[0].start() > 0:
        preamble = text[:matches[0].start()].strip()
        if preamble:
            sections.insert(0, {
                "text": preamble,
                "heading_path": "",
                "page_marker": _last_page_marker(text, 0, page_re),
            })

    return sections


def _last_page_marker(text: str, up_to: int, page_re) -> str | None:
    markers = list(page_re.finditer(text[:up_to]))
    return markers[-1].group(0) if markers else None


def _split_by_tokens(section: dict, max_tokens: int, connector, doc_id: str) -> list[dict]:
    paragraphs = re.split(r"\n{2,}", section["text"])
    chunks: list[dict] = []
    current_parts: list[str] = []
    current_tokens = 0

    for para in paragraphs:
        para_tokens = connector.count_tokens(para)
        if current_tokens + para_tokens > max_tokens and current_parts:
            chunks.append(_make_chunk(current_parts, section, doc_id))
            current_parts = []
            current_tokens = 0

        if para_tokens > max_tokens:
            # Single oversized paragraph: split by token windows
            for window in _token_windows(para, max_tokens, connector):
                chunks.append(_make_chunk([window], section, doc_id))
        else:
            current_parts.append(para)
            current_tokens += para_tokens

    if current_parts:
        chunks.append(_make_chunk(current_parts, section, doc_id))

    return chunks


def _make_chunk(parts: list[str], section: dict, doc_id: str) -> dict:
    return {
        "chunk_id": str(uuid.uuid4()),
        "doc_id": doc_id,
        "text": "\n\n".join(parts),
        "heading_path": section["heading_path"],
        "page_marker": section.get("page_marker"),
    }


def _token_windows(text: str, max_tokens: int, connector, overlap: int = 50) -> list[str]:
    words = text.split()
    windows: list[str] = []
    start = 0
    while start < len(words):
        end = start
        accumulated = 0
        while end < len(words):
            token_count = connector.count_tokens(" ".join(words[start:end + 1]))
            if token_count > max_tokens:
                break
            accumulated = token_count
            end += 1
        if end == start:
            end = start + 1  # at minimum one word
        windows.append(" ".join(words[start:end]))
        start = max(start + 1, end - overlap)
    return windows
