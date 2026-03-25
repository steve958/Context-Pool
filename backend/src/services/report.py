from datetime import datetime, timezone
import html as html_lib


def build_report(run: dict) -> dict:
    result = run.get("result", {})
    return {
        "run_id": run["run_id"],
        "question": run["question"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "final_answer": result.get("final_answer"),
        "citations": result.get("citations", []),
        "token_usage": result.get("token_usage"),
    }


def build_html_report(run: dict) -> str:
    result = run.get("result", {})
    question = html_lib.escape(run.get("question", ""))
    final_answer = html_lib.escape(result.get("final_answer", ""))
    citations = result.get("citations", [])
    token_usage = result.get("token_usage")
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    run_id = run["run_id"]

    def citation_html(c: dict, i: int) -> str:
        heading = html_lib.escape(c.get("heading_path") or "")
        page = html_lib.escape(c.get("page_marker") or "")
        quote = html_lib.escape(c.get("quote") or "")
        doc_id = html_lib.escape(c.get("doc_id") or "")
        badge = f'<span class="badge">{page}</span>' if page else ""
        heading_line = f'<div class="heading">{heading}</div>' if heading else ""
        return f"""
        <div class="citation">
          <div class="citation-header">
            <span class="citation-num">[{i + 1}]</span>
            <div class="citation-meta">
              {heading_line}
              {badge}
            </div>
          </div>
          <blockquote class="quote">{quote}</blockquote>
          <div class="doc-id">doc: {doc_id}</div>
        </div>"""

    citations_html = "\n".join(citation_html(c, i) for i, c in enumerate(citations))
    citations_section = f"""
      <section>
        <h2>Citations <span class="count">({len(citations)})</span></h2>
        {citations_html if citations else '<p class="muted">No citations.</p>'}
      </section>""" if citations else ""

    import json
    usage_section = ""
    if token_usage:
        usage_section = f"""
      <section>
        <h2>Token Usage</h2>
        <pre class="token-usage">{html_lib.escape(json.dumps(token_usage, indent=2))}</pre>
      </section>"""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Context Pool Report</title>
  <style>
    *, *::before, *::after {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 14px;
      line-height: 1.6;
      background: #0f0f0f;
      color: #f4f4f5;
    }}
    .container {{ max-width: 760px; margin: 0 auto; padding: 48px 24px; }}
    header {{ margin-bottom: 40px; border-bottom: 1px solid #2e2e2e; padding-bottom: 24px; }}
    .logo {{ font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
              color: #6366f1; margin-bottom: 8px; }}
    .meta {{ font-size: 11px; color: #52525b; }}
    h2 {{ font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em;
           color: #71717a; margin: 0 0 16px; }}
    .count {{ font-weight: 400; }}
    section {{ margin-bottom: 40px; }}
    .question-box {{
      background: #1a1a1a;
      border: 1px solid #2e2e2e;
      border-radius: 10px;
      padding: 20px;
      margin-bottom: 40px;
    }}
    .question-box h2 {{ margin-bottom: 10px; }}
    .question-text {{ color: #f4f4f5; font-size: 15px; font-weight: 500; }}
    .answer-box {{
      background: #1a1a1a;
      border: 1px solid #2e2e2e;
      border-left: 3px solid #6366f1;
      border-radius: 10px;
      padding: 20px;
      margin-bottom: 40px;
      white-space: pre-wrap;
      color: #f4f4f5;
    }}
    .citation {{
      background: #1a1a1a;
      border: 1px solid #2e2e2e;
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 12px;
    }}
    .citation-header {{ display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }}
    .citation-num {{ font-family: monospace; font-size: 11px; color: #52525b;
                     background: #242424; border-radius: 4px; padding: 2px 6px; white-space: nowrap; }}
    .citation-meta {{ flex: 1; }}
    .heading {{ font-size: 12px; color: #a1a1aa; margin-bottom: 4px; }}
    .badge {{ display: inline-block; font-size: 10px; background: #242424; color: #a1a1aa;
               border: 1px solid #3f3f46; border-radius: 4px; padding: 1px 6px; }}
    .quote {{
      margin: 0;
      background: #0f0f0f;
      border: 1px solid #2e2e2e;
      border-radius: 6px;
      padding: 12px 16px;
      font-family: "JetBrains Mono", "Fira Code", monospace;
      font-size: 12px;
      color: #a1a1aa;
      white-space: pre-wrap;
      word-break: break-word;
    }}
    .doc-id {{ margin-top: 8px; font-size: 11px; color: #52525b; font-family: monospace; }}
    .token-usage {{
      background: #1a1a1a;
      border: 1px solid #2e2e2e;
      border-radius: 8px;
      padding: 16px;
      font-family: "JetBrains Mono", monospace;
      font-size: 12px;
      color: #a1a1aa;
      overflow-x: auto;
    }}
    .muted {{ color: #52525b; }}
    footer {{ margin-top: 48px; padding-top: 24px; border-top: 1px solid #2e2e2e;
               font-size: 11px; color: #52525b; }}
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="logo">Context Pool</div>
      <div class="meta">Generated {timestamp} &nbsp;·&nbsp; Run {run_id}</div>
    </header>

    <div class="question-box">
      <h2>Question</h2>
      <div class="question-text">{question}</div>
    </div>

    <section>
      <h2>Answer</h2>
      <div class="answer-box">{final_answer}</div>
    </section>

    {citations_section}
    {usage_section}

    <footer>Context Pool &mdash; Self-hosted document Q&amp;A</footer>
  </div>
</body>
</html>"""
