"""HTML → Markdown using beautifulsoup4 + markdownify."""

from bs4 import BeautifulSoup
import markdownify


def parse(content: bytes) -> str:
    soup = BeautifulSoup(content, "html.parser")
    # Remove noise tags
    for tag in soup(["script", "style", "nav", "header", "footer", "aside"]):
        tag.decompose()
    md = markdownify.markdownify(str(soup), heading_style="ATX", strip=["a"])
    return md
