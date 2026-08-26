"""Minimal Strands-powered EchoReport service.

The browser prototype can run without this service, but a deployed submission
should point VITE_AGENT_API_URL at this process so every response is generated
by the Strands agent loop instead of the offline fallback.
"""

from __future__ import annotations

import json
import os
import sqlite3
from concurrent.futures import ThreadPoolExecutor, TimeoutError
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

SYSTEM_PROMPT = """你叫小野，是 EchoReport 中温和、专业的心理支持专家和自我反思陪伴者。
请使用简体中文，以温暖、简洁、共情的方式回应。你提供的是非医疗性的心理支持，
不能进行诊断、贴标签或声称提供心理治疗。每次回复只问一个温和的追问，帮助用户
更清楚地理解自己的感受。如果用户描述正在发生的自伤或伤害他人的风险，立即鼓励
联系当地紧急服务或可信任的人，并停止普通的反思对话。不要臆测上传图片的内容；
无法理解图片时要明确说明。
这是一个受约束的 ReAct 流程：先调用 retrieve_memory，再基于观察结果回应；
如果用户表达了稳定、未来仍有价值的偏好或经历，调用 save_memory 保存一句简短事实。
"""

MEMORY_DB = Path(os.getenv("ECHOREPORT_MEMORY_DB", Path(__file__).with_name("memory.db")))
PROMPT_ROOT = Path("/Volumes/文档/公司/赛尔教育/心澄 Prompt/提示词/04_当前活跃提示词")
CONVERSATION_PROMPT = PROMPT_ROOT / "对话_晓青/对话节点_v2.7.md"
STRATEGY_PROMPT = PROMPT_ROOT / "对话_晓青/策略节点_v2.7.md"
REPORT_PROMPT = PROMPT_ROOT / "对话报告-分析报告.yml"


def _source_prompt(path: Path, fallback: str) -> str:
    """Read the supplied source prompt locally, with a safe deploy fallback."""
    # The exported Dify YAML contains workflow metadata but its LLM prompt
    # field is empty, so it is not executable prompt text.
    if path == REPORT_PROMPT:
        return fallback
    try:
        return path.read_text(encoding="utf-8").replace("晓青", "小野")
    except (OSError, UnicodeError):
        return fallback


def _memory_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(MEMORY_DB)
    connection.execute("CREATE TABLE IF NOT EXISTS memories (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, note TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP)")
    return connection


def retrieve_memories(query: str, user_id: str = "local-user") -> list[str]:
    terms = [term for term in query.strip().split() if len(term) > 1][:6]
    connection = _memory_connection()
    try:
        if not terms:
            rows = connection.execute("SELECT note FROM memories WHERE user_id = ? ORDER BY id DESC LIMIT 5", (user_id,)).fetchall()
        else:
            pattern = "%" + "%".join(terms) + "%"
            rows = connection.execute("SELECT note FROM memories WHERE user_id = ? AND note LIKE ? ORDER BY id DESC LIMIT 5", (user_id, pattern)).fetchall()
        return [str(row[0]) for row in rows]
    finally:
        connection.close()


def save_memory(note: str, user_id: str = "local-user") -> str:
    clean = " ".join(note.strip().split())[:240]
    if not clean:
        return "未保存：记忆内容为空"
    connection = _memory_connection()
    try:
        connection.execute("INSERT INTO memories (user_id, note) VALUES (?, ?)", (user_id, clean))
        connection.commit()
    finally:
        connection.close()
    return "已保存一条长期记忆"


def _agent(system_prompt: str = SYSTEM_PROMPT) -> Any:
    from strands import Agent, tool

    provider = os.getenv("MODEL_PROVIDER", "tencent").lower()
    model_id = os.getenv("BEDROCK_MODEL_ID")
    kwargs: dict[str, Any] = {"system_prompt": system_prompt}

    @tool
    def retrieve_memory(query: str) -> str:
        """Retrieve relevant long-term memories from this local user's private memory store."""
        return json.dumps(retrieve_memories(query), ensure_ascii=False)

    @tool
    def save_memory_tool(note: str) -> str:
        """Save one concise, non-sensitive fact that may help future conversations."""
        return save_memory(note)

    kwargs["tools"] = [retrieve_memory, save_memory_tool]
    if provider == "ollama":
        from strands.models.ollama import OllamaModel

        kwargs["model"] = OllamaModel(
            host=os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434"),
            model_id=os.getenv("OLLAMA_MODEL_ID", "gemma4:12b"),
            max_tokens=int(os.getenv("OLLAMA_MAX_TOKENS", "512")),
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


def _invoke(agent: Any, prompt: str, timeout: float = 20) -> str:
    """Bound model latency; callers can switch to a simpler route on timeout."""
    executor = ThreadPoolExecutor(max_workers=1)
    future = executor.submit(agent, prompt)
    try:
        return _text(future.result(timeout=timeout))
    finally:
        executor.shutdown(wait=False, cancel_futures=True)


def chat(payload: dict[str, Any]) -> dict[str, str]:
    text = str(payload.get("text", "")).strip()
    if not text:
        raise ValueError("text is required")
    if any(keyword in text for keyword in ("你是谁", "你叫什么", "名字是什么")):
        return {"text": "我叫小野，是你的心理支持陪伴者。我会用心理学视角陪你梳理感受和现实困扰，但不会替代专业医疗或心理治疗。"}
    context = payload.get("context", [])
    memories = retrieve_memories(text)
    history = json.dumps(context, ensure_ascii=False)
    strategy_fallback = "你是心理支持对话的策略分析节点。只输出JSON，包含 safety_alert、analysis、direction、reply_style。"
    strategy_prompt = _source_prompt(STRATEGY_PROMPT, strategy_fallback)
    strategy_input = strategy_prompt.replace("{{#1730898300872.user_profile#}}", json.dumps(memories, ensure_ascii=False)).replace("{{#1730898300872.recent_messages#}}", history).replace("{{#sys.query#}}", text)
    try:
        strategy_raw = _invoke(_agent(strategy_prompt), strategy_input)
    except Exception:
        strategy_raw = json.dumps({"safety_alert": None, "analysis": "策略节点超时，改用直接回应。", "direction": "直接回答用户当前问题，保持共情和简洁。", "reply_style": "短+陈述"}, ensure_ascii=False)
    conversation_prompt = _source_prompt(CONVERSATION_PROMPT, SYSTEM_PROMPT)
    conversation_input = f"用户资料/长期记忆：{json.dumps(memories, ensure_ascii=False)}\n对话历史：{history}\n用户本轮输入：{text}\n策略节点JSON：{strategy_raw}"
    try:
        response = _invoke(_agent(conversation_prompt), conversation_input)
    except Exception:
        response = "我听见你在问我是谁。我叫小野，会用心理学视角陪你梳理感受和现实困扰，但不会替代专业医疗或心理治疗。"
    # Keep a private, local conversation trace even when the model chooses not
    # to call the optional save_memory tool; retrieval remains model-driven.
    save_memory(f"用户表达：{text}")
    return {"text": response}


def report(payload: dict[str, Any]) -> dict[str, Any]:
    messages = payload.get("messages", [])
    memories = retrieve_memories(" ".join(str(item.get("text", "")) for item in messages if isinstance(item, dict)))
    report_fallback = """你是小野，负责生成非医疗性的心理反思报告。请严格只输出JSON，字段为title、content、emoji、continue。content应包含对话总结、心理分析、温和的安慰与下一步思考，不要诊断或过度解读。"""
    report_prompt = _source_prompt(REPORT_PROMPT, report_fallback)
    prompt = report_prompt + "\n\n请基于以下本次对话生成结构化JSON。\n长期记忆（仅作背景）：" + json.dumps(memories, ensure_ascii=False) + "\nMessages:\n" + json.dumps(messages, ensure_ascii=False)
    try:
        raw = _invoke(_agent(report_prompt), prompt, timeout=30)
    except Exception:
        raw = "{\"title\":\"这一段想慢慢说的话\",\"content\":\"模型暂时需要多一点时间整理这段表达。你已经愿意把它说出来，这本身就是在照顾自己。\",\"continue\":\"下次可以从此刻最在意的部分继续聊。\",\"emoji\":\"🌿\"}"
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw
        raw = raw.rsplit("```", 1)[0].strip()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        data = {"title": "这一段想慢慢说的话", "feelings": raw, "evidence": [], "nextStep": "先给自己两分钟安静时间。", "nextQuestion": "此刻最希望被理解的是什么？"}
    if "content" in data:
        data = {
            "title": data.get("title", "这一段想慢慢说的话"),
            "feelings": data.get("content", ""),
            "evidence": data.get("evidence", []),
            "nextStep": data.get("nextStep", "先给自己两分钟安静时间。"),
            "nextQuestion": data.get("continue", data.get("nextQuestion", "此刻最希望被理解的是什么？")),
        }
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
