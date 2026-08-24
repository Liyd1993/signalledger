import shutil

from fastapi.testclient import TestClient
from signalledger.app import DB_PATH, app
from signalledger.decision_engine import decide


def test_analysis_returns_completed_evidence_backed_result():
    shutil.rmtree(DB_PATH.parent, ignore_errors=True)
    client = TestClient(app)
    created = client.post("/api/analysis", json={"question": "Should we build scheduled CSV exports?"})
    result = client.get(f"/api/analysis/{created.json()['task_id']}").json()
    assert result["status"] == "completed"
    assert len(result["recommendation"]["evidence_ids"]) >= 2


def test_rejects_non_synthetic_feedback():
    client = TestClient(app)
    response = client.post("/api/feedback", json={"id":"x","persona":"x","account_tier":"x","text":"x","severity":1,"received_at":"2026-01-01","synthetic":False})
    assert response.status_code == 400


def test_agent_analysis_exposes_model_and_evidence(monkeypatch):
    monkeypatch.setattr("signalledger.app.run_agent_analysis", lambda question, feedback: {
        "recommendation": decide(question, feedback).__dict__,
        "agent": {"provider": "ollama", "model": "gemma4:12b", "tools": ["retrieve_feedback", "create_decision"]},
    })
    response = TestClient(app).post("/api/agent-analysis", json={"question": "Should we build scheduled CSV exports?"})
    assert response.status_code == 200
    assert response.json()["agent"]["provider"] == "ollama"
    assert response.json()["decision_id"]
