import json
import hashlib
import os
import sqlite3
import uuid
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from mangum import Mangum
from pydantic import BaseModel

from signalledger.data import load_feedback
from signalledger.decision_engine import decide

ROOT = Path(__file__).parent
DB_PATH = Path(".local/signalledger.db")
app = FastAPI(title="SignalLedger")
lambda_handler = Mangum(app, lifespan="off")


class AnalysisRequest(BaseModel):
    question: str


class FeedbackRequest(BaseModel):
    id: str
    persona: str
    account_tier: str
    text: str
    severity: int
    received_at: str
    synthetic: bool


def connection() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(exist_ok=True)
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    db.execute("CREATE TABLE IF NOT EXISTS decisions (id TEXT PRIMARY KEY, question TEXT, payload TEXT, status TEXT, change_reason TEXT)")
    db.execute("CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, payload TEXT)")
    return db


def all_feedback() -> list[dict[str, object]]:
    if os.getenv("DATABASE_URL"):
        return cloud_feedback()
    extra_path = Path(".local/extra_feedback.json")
    return load_feedback() + (json.loads(extra_path.read_text()) if extra_path.exists() else [])


def embedding(text: str) -> str:
    digest = hashlib.sha256(text.encode()).digest()[:8]
    return "[" + ",".join(f"{(byte - 127.5) / 127.5:.6f}" for byte in digest) + "]"


def cloud_connection():
    import psycopg
    from psycopg.rows import dict_row

    return psycopg.connect(os.environ["DATABASE_URL"], row_factory=dict_row)


def seed_feedback() -> list[dict[str, object]]:
    bucket = os.getenv("S3_BUCKET")
    if not bucket:
        return load_feedback()
    import boto3

    body = boto3.client("s3").get_object(Bucket=bucket, Key="feedback.json")["Body"].read()
    return json.loads(body)


def cloud_feedback() -> list[dict[str, object]]:
    with cloud_connection() as db:
        rows = db.execute(
            "SELECT id, persona, account_tier, received_at::STRING AS received_at, text, severity, true AS synthetic FROM feedback_items ORDER BY received_at"
        ).fetchall()
        if not rows:
            for item in seed_feedback():
                db.execute(
                    "INSERT INTO feedback_items (id, source, persona, account_tier, received_at, text, severity, embedding) VALUES (%s, 'synthetic_seed', %s, %s, %s, %s, %s, %s::VECTOR) ON CONFLICT (id) DO NOTHING",
                    (item["id"], item["persona"], item["account_tier"], item["received_at"], item["text"], item["severity"], embedding(str(item["text"]))),
                )
            rows = db.execute(
                "SELECT id, persona, account_tier, received_at::STRING AS received_at, text, severity, true AS synthetic FROM feedback_items ORDER BY received_at"
            ).fetchall()
    return [dict(row) for row in rows]


def save_task(task_id: str, payload: dict[str, object]) -> None:
    if os.getenv("DATABASE_URL"):
        with cloud_connection() as db:
            db.execute(
                "INSERT INTO analysis_tasks (id, question, status, result, completed_at) VALUES (%s, %s, 'completed', %s::JSONB, now())",
                (task_id, str(payload["question"]), json.dumps(payload)),
            )
        return
    with connection() as db:
        db.execute("INSERT OR REPLACE INTO tasks VALUES (?, ?)", (task_id, json.dumps(payload)))


@app.get("/")
def homepage() -> FileResponse:
    return FileResponse(ROOT / "static" / "index.html")


@app.get("/static/{name}")
def static(name: str) -> FileResponse:
    return FileResponse(ROOT / "static" / name)


@app.get("/api/feedback")
def feedback() -> dict[str, list[dict[str, object]]]:
    return {"feedback": all_feedback()}


@app.post("/api/analysis")
def analyze(request: AnalysisRequest) -> dict[str, str]:
    result = decide(request.question, all_feedback())
    task_id, decision_id = str(uuid.uuid4()), str(uuid.uuid4())
    payload = {"status": "completed", "question": request.question, "recommendation": result.__dict__, "decision_id": decision_id}
    if os.getenv("DATABASE_URL"):
        with cloud_connection() as db:
            previous = db.execute(
                "SELECT id FROM decisions WHERE question = %s AND review_status IN ('current', 'needs_review') ORDER BY created_at DESC LIMIT 1",
                (request.question,),
            ).fetchone()
            db.execute("UPDATE decisions SET review_status = 'superseded' WHERE question = %s AND review_status IN ('current', 'needs_review')", (request.question,))
            db.execute(
                "INSERT INTO decisions (id, question, recommendation, confidence, rationale, review_status, validation_experiment, supersedes_decision_id) VALUES (%s, %s, %s, %s, %s, 'current', %s, %s)",
                (decision_id, request.question, result.recommendation, result.confidence, result.rationale, result.validation_experiment, previous["id"] if previous else None),
            )
            for feedback_id in result.evidence_ids:
                db.execute(
                    "INSERT INTO decision_evidence (decision_id, feedback_id, relevance_score, claim) VALUES (%s, %s, 1.0, %s)",
                    (decision_id, feedback_id, "Cited synthetic feedback"),
                )
        save_task(task_id, payload)
        return {"task_id": task_id, "status": "queued"}
    with connection() as db:
        db.execute("UPDATE decisions SET status = 'superseded' WHERE question = ? AND status = 'current'", (request.question,))
        db.execute("INSERT INTO decisions VALUES (?, ?, ?, 'current', '')", (decision_id, request.question, json.dumps(result.__dict__)))
    save_task(task_id, payload)
    return {"task_id": task_id, "status": "queued"}


@app.get("/api/analysis/{task_id}")
def task(task_id: str) -> dict[str, object]:
    if os.getenv("DATABASE_URL"):
        with cloud_connection() as db:
            row = db.execute("SELECT result FROM analysis_tasks WHERE id = %s", (task_id,)).fetchone()
        if row is None:
            raise HTTPException(404, "Analysis task not found")
        return row["result"]
    with connection() as db:
        row = db.execute("SELECT payload FROM tasks WHERE id = ?", (task_id,)).fetchone()
    if row is None:
        raise HTTPException(404, "Analysis task not found")
    return json.loads(row["payload"])


@app.get("/api/decisions")
def decisions() -> dict[str, list[dict[str, object]]]:
    if os.getenv("DATABASE_URL"):
        with cloud_connection() as db:
            rows = db.execute(
                "SELECT d.*, coalesce(array_agg(e.feedback_id) FILTER (WHERE e.feedback_id IS NOT NULL), ARRAY[]::STRING[]) AS evidence_ids FROM decisions d LEFT JOIN decision_evidence e ON e.decision_id = d.id GROUP BY d.id ORDER BY d.created_at DESC"
            ).fetchall()
        return {"decisions": [dict(row) | {"status": row["review_status"], "payload": {"recommendation": row["recommendation"], "confidence": row["confidence"], "rationale": row["rationale"], "validation_experiment": row["validation_experiment"], "evidence_ids": row["evidence_ids"]}} for row in rows]}
    with connection() as db:
        rows = db.execute("SELECT * FROM decisions ORDER BY rowid DESC").fetchall()
    return {"decisions": [dict(row) | {"payload": json.loads(row["payload"])} for row in rows]}


@app.post("/api/feedback")
def add_feedback(item: FeedbackRequest) -> dict[str, str]:
    if item.synthetic is not True:
        raise HTTPException(400, "SignalLedger demo accepts synthetic feedback only")
    if os.getenv("DATABASE_URL"):
        with cloud_connection() as db:
            db.execute(
                "INSERT INTO feedback_items (id, source, persona, account_tier, received_at, text, severity, embedding) VALUES (%s, 'synthetic_demo', %s, %s, %s, %s, %s, %s::VECTOR) ON CONFLICT (id) DO NOTHING",
                (item.id, item.persona, item.account_tier, item.received_at, item.text, item.severity, embedding(item.text)),
            )
            db.execute("UPDATE decisions SET review_status = 'needs_review', change_reason = %s WHERE review_status = 'current'", (f"New evidence: {item.persona}",))
        return {"status": "saved"}
    path = Path(".local/extra_feedback.json")
    path.parent.mkdir(exist_ok=True)
    rows = json.loads(path.read_text()) if path.exists() else []
    rows.append(item.model_dump())
    path.write_text(json.dumps(rows), encoding="utf-8")
    with connection() as db:
        db.execute("UPDATE decisions SET status = 'needs_review', change_reason = ? WHERE status = 'current'", (f"New evidence: {item.persona}",))
    return {"status": "saved"}
