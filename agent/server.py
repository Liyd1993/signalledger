"""Minimal Strands-powered EchoReport service.

The browser prototype can run without this service, but a deployed submission
should point VITE_AGENT_API_URL at this process so every response is generated
by the Strands agent loop instead of the offline fallback.
"""

from __future__ import annotations

import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

SYSTEM_PROMPT = """You are EchoReport, a non-clinical reflective conversation companion.
Respond in Simplified Chinese, with warmth and brevity. Never diagnose, label,
or claim to provide therapy. Ask one gentle follow-up question. If the user
describes imminent self-harm or harm to others, encourage contacting local
emergency services or a trusted person immediately and do not continue normal
reflection. Do not invent facts about an uploaded image; say when image
understanding is unavailable.
"""


def _agent() -> Any:
    from strands import Agent

    provider = os.getenv("MODEL_PROVIDER", "tencent").lower()
    model_id = os.getenv("BEDROCK_MODEL_ID")
    kwargs: dict[str, Any] = {"system_prompt": SYSTEM_PROMPT}
    if provider == "ollama":
        from strands.models.ollama import OllamaModel

        kwargs["model"] = OllamaModel(
            host=os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434"),
            model_id=os.getenv("OLLAMA_MODEL_ID", "gemma4:12b"),
        )
    elif provider == "tencent":
        from strands.models.openai import OpenAIModel

        api_key = os.getenv("TENCENT_API_KEY") or os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("TENCENT_API_KEY is required when MODEL_PROVIDER=tencent")
        kwargs["model"] = OpenAIModel(
            client_args={"api_key": api_key, "base_url": os.getenv("TENCENT_BASE_URL", "https://api.lkeap.cloud.tencent.com/plan/v3")},
            model_id=os.getenv("TENCENT_MODEL_ID", "hy3"),
        )
    elif model_id:
        kwargs["model"] = model_id
    return Agent(**kwargs)


def _text(result: Any) -> str:
    return str(result).strip()


def chat(payload: dict[str, Any]) -> dict[str, str]:
    text = str(payload.get("text", "")).strip()
    if not text:
        raise ValueError("text is required")
    context = payload.get("context", [])
    prompt = f"Previous turns (use only as context): {json.dumps(context, ensure_ascii=False)}\nUser: {text}"
    return {"text": _text(_agent()(prompt))}


def report(payload: dict[str, Any]) -> dict[str, Any]:
    messages = payload.get("messages", [])
    prompt = """Create a concise reflection report from the user's messages.
Return JSON only with keys: title, feelings, evidence (array of up to 3 exact
user phrases), nextStep, nextQuestion. Keep it non-clinical and actionable.
Messages:\n""" + json.dumps(messages, ensure_ascii=False)
    raw = _text(_agent()(prompt))
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw
        raw = raw.rsplit("```", 1)[0].strip()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        data = {"title": "这一段想慢慢说的话", "feelings": raw, "evidence": [], "nextStep": "先给自己两分钟安静时间。", "nextQuestion": "此刻最希望被理解的是什么？"}
    return data


class Handler(BaseHTTPRequestHandler):
    def _send(self, status: int, data: dict[str, Any]) -> None:
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", os.getenv("CORS_ORIGIN", "*"))
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self._send(204, {})

    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/health":
            self._send(200, {"ok": True, "service": "echoreport-strands"})
            return
        self._send(404, {"error": "not found"})

    def do_POST(self) -> None:  # noqa: N802
        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length) or b"{}")
            if self.path == "/api/chat":
                self._send(200, chat(payload))
            elif self.path == "/api/report":
                self._send(200, report(payload))
            else:
                self._send(404, {"error": "not found"})
        except (ValueError, json.JSONDecodeError) as exc:
            self._send(400, {"error": str(exc)})
        except Exception as exc:  # service boundary: return JSON, keep process alive
            self._send(502, {"error": f"agent unavailable: {exc}"})


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8787"))
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
