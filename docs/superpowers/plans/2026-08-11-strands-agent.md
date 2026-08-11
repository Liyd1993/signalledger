# SignalLedger Strands Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make SignalLedger a local, tool-using Strands Agent suitable for the Agents for Humans Professional Agent track.

**Architecture:** Keep FastAPI and the transparent decision engine. Add a Strands adapter that creates an Ollama-backed `Agent` with narrow feedback retrieval and decision tools, then expose it through a new endpoint and make it the UI's primary action.

**Tech Stack:** Python 3.11, FastAPI, Strands Agents SDK with Ollama provider, local Ollama `gemma4:12b`, pytest, vanilla JavaScript.

## Global Constraints

- Use only synthetic feedback bundled in `data/feedback.json` or created by the existing demo control.
- Require no AWS account, payment method, API key, cloud database, or remote tool.
- Use Strands `Agent`, `OllamaModel`, and `@tool` for the production agent path.
- Preserve `/api/analysis` as deterministic comparison behavior.
- Return a clear 503 if Ollama is unavailable; never present deterministic output as an agent execution.

---

### Task 1: Add the Strands dependency and agent adapter

**Files:**
- Modify: `pyproject.toml`
- Create: `src/signalledger/strands_agent.py`
- Create: `tests/test_strands_agent.py`

**Interfaces:**
- Produces: `run_agent_analysis(question: str, feedback: list[dict[str, object]]) -> dict[str, object]`
- Produces: `agent_configuration() -> dict[str, str]`

- [ ] **Step 1: Write the failing configuration test**

```python
from signalledger.strands_agent import agent_configuration

def test_agent_uses_local_ollama_and_named_tools():
    config = agent_configuration()
    assert config["model"] == "gemma4:12b"
    assert config["provider"] == "ollama"
    assert config["tools"] == "retrieve_feedback,create_decision"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `uv run pytest tests/test_strands_agent.py -q`

Expected: FAIL because `signalledger.strands_agent` does not exist.

- [ ] **Step 3: Write minimal implementation**

```python
from strands import Agent, tool
from strands.models.ollama import OllamaModel

def agent_configuration() -> dict[str, str]:
    return {"provider": "ollama", "model": "gemma4:12b", "tools": "retrieve_feedback,create_decision"}
```

Decorate a retrieval function and a decision function with `@tool`; construct an `Agent` with `OllamaModel(host="http://127.0.0.1:11434", model_id="gemma4:12b")`; return its tool-backed response and decision record.

- [ ] **Step 4: Run target test**

Run: `uv run pytest tests/test_strands_agent.py -q`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add pyproject.toml uv.lock src/signalledger/strands_agent.py tests/test_strands_agent.py
git commit -m "feat: add local Strands feedback agent"
```

### Task 2: Expose the agent run in API and UI

**Files:**
- Modify: `src/signalledger/app.py`
- Modify: `src/signalledger/static/app.js`
- Modify: `tests/test_api.py`

**Interfaces:**
- Consumes: `run_agent_analysis(question, feedback)`
- Produces: `POST /api/agent-analysis` with `{question}` JSON and a completed recommendation response.

- [ ] **Step 1: Write failing API test**

```python
def test_agent_analysis_exposes_model_and_evidence(monkeypatch):
    monkeypatch.setattr("signalledger.app.run_agent_analysis", lambda question, feedback: {
        "recommendation": decide(question, feedback).__dict__,
        "agent": {"provider": "ollama", "model": "gemma4:12b", "tools": ["retrieve_feedback", "create_decision"]},
    })
    response = TestClient(app).post("/api/agent-analysis", json={"question": "Should we build scheduled CSV exports?"})
    assert response.status_code == 200
    assert response.json()["agent"]["provider"] == "ollama"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `uv run pytest tests/test_api.py::test_agent_analysis_exposes_model_and_evidence -q`

Expected: FAIL with 404.

- [ ] **Step 3: Implement endpoint and UI call**

```python
@app.post("/api/agent-analysis")
def agent_analyze(request: AnalysisRequest) -> dict[str, object]:
    return run_agent_analysis(request.question, all_feedback())
```

Map a local-model connection failure to `HTTPException(503, ...)`. Change `analyze()` in `app.js` to call `/api/agent-analysis` and render provider, model, and tool names above the recommendation.

- [ ] **Step 4: Run API tests**

Run: `uv run pytest tests/test_api.py -q`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/signalledger/app.py src/signalledger/static/app.js tests/test_api.py
git commit -m "feat: expose Strands agent analysis"
```

### Task 3: Validate local run and update submission materials

**Files:**
- Modify: `README.md`
- Modify: `docs/architecture.md`
- Modify: `docs/devpost-submission.md`
- Modify: `docs/demo-script.md`

**Interfaces:**
- Consumes: local endpoint and agent metadata from Task 2.
- Produces: reproducible run instructions, architecture diagram, submission copy, and a five-minute demo sequence.

- [ ] **Step 1: Add integration assertion**

```python
def test_agent_result_contains_cited_evidence():
    result = run_agent_analysis("Should we build scheduled CSV exports?", load_feedback())
    assert result["recommendation"]["evidence_ids"]
    assert result["agent"]["tools"] == ["retrieve_feedback", "create_decision"]
```

- [ ] **Step 2: Run it against local Ollama**

Run: `uv run pytest tests/test_strands_agent.py -q`

Expected: PASS with local Ollama; otherwise a precise connection error identifying `http://127.0.0.1:11434`.

- [ ] **Step 3: Document actual path**

State that the Strands SDK uses Ollama plus two custom tools, the demo uses synthetic data only, and no cloud account is needed. Replace CockroachDB/AWS references in submission materials with Agents for Humans Professional Agent copy.

- [ ] **Step 4: Run full suite and smoke test**

Run: `uv run pytest -q && uv run uvicorn signalledger.app:app --port 8000`

Expected: all tests PASS; `POST /api/agent-analysis` returns tool-backed output.

- [ ] **Step 5: Commit and push**

```bash
git add README.md docs tests/test_strands_agent.py
git commit -m "docs: prepare Agents for Humans submission"
git push origin main
```

