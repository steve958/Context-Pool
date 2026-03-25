"""DOCX → Markdown using python-docx."""

import io
from docx import Document
from docx.oxml.ns import qn


def parse(content: bytes) -> str:
    doc = Document(io.BytesIO(content))
    parts: list[str] = []

    for block in doc.element.body:
        tag = block.tag.split("}")[-1]
        if tag == "p":
            para = _para_to_md(block, doc)
            if para:
                parts.append(para)
        elif tag == "tbl":
            parts.append(_table_to_md(block, doc))

    return "\n\n".join(parts)


def _para_to_md(elem, doc) -> str:
    from docx.oxml.ns import qn

    style = elem.find(f".//{{{elem.nsmap.get('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main')}}}pStyle")
    style_val = style.get(f"{{{elem.nsmap.get('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main')}}}val", "") if style is not None else ""

    heading_map = {
        "Heading1": "#", "Heading2": "##", "Heading3": "###",
        "Heading4": "####", "Heading5": "#####", "Heading6": "######",
    }

    text = _runs_to_text(elem)
    if not text.strip():
        return ""

    if style_val in heading_map:
        return f"{heading_map[style_val]} {text.strip()}"

    return text.strip()


def _runs_to_text(elem) -> str:
    ns = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
    parts = []
    for run in elem.findall(f".//{{{ns}}}r"):
        bold = run.find(f".//{{{ns}}}b") is not None
        italic = run.find(f".//{{{ns}}}i") is not None
        t = run.find(f"{{{ns}}}t")
        text = (t.text or "") if t is not None else ""
        if bold and italic:
            text = f"***{text}***"
        elif bold:
            text = f"**{text}**"
        elif italic:
            text = f"*{text}*"
        parts.append(text)
    return "".join(parts)


def _table_to_md(elem, doc) -> str:
    ns = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
    rows = elem.findall(f"{{{ns}}}tr")
    if not rows:
        return ""

    md_rows = []
    for i, row in enumerate(rows):
        cells = row.findall(f"{{{ns}}}tc")
        cell_texts = [_runs_to_text(cell).strip().replace("\n", " ") for cell in cells]
        md_rows.append("| " + " | ".join(cell_texts) + " |")
        if i == 0:
            md_rows.append("|" + "|".join(["---"] * len(cells)) + "|")

    return "\n".join(md_rows)
