# SignalLedger five-minute demo script

## 0:00–0:30 — Problem and safety boundary

“Product feedback gets scattered across tools, then the rationale for a roadmap decision disappears. SignalLedger is a professional product-feedback agent. This public demo contains synthetic data only; it has no customer connector, cloud account, or API key.”

## 0:30–1:45 — Real agent run

Open the dashboard and click **Run the feedback agent**. Point out the execution label: Strands Agents SDK, local Ollama `gemma4:12b`, and exactly two custom tools. Explain: “The model is instructed to call `retrieve_feedback` first, then `create_decision`. It cannot browse, edit files, run a shell, or access anything beyond this synthetic feedback set.” Show the cited operations, analytics, support, and executive signals, then the `build now` recommendation and its validation experiment.

## 1:45–2:45 — Explain the two-tool boundary

Show `src/signalledger/strands_agent.py`. `retrieve_feedback` returns no more than four matching records. `create_decision` applies a transparent rule that requires at least two relevant sources. Say: “The LLM drives the workflow; it cannot fabricate evidence or overwrite the rule. If it skips the required decision tool, the API returns an error instead of pretending it analyzed anything.”

## 2:45–3:35 — Re-evaluation

Show the decision history. Click **Add new enterprise evidence**. The current record changes to `needs review`. Run the agent again and explain that the new recommendation uses the expanded evidence set and creates a successor decision.

## 3:35–4:20 — Local, reproducible setup

Show the README commands: `uv sync --dev`, `ollama serve`, and `uv run uvicorn signalledger.app:app --reload`. Show `tests/test_strands_agent.py` and the test output. Close with: “SignalLedger makes autonomous triage useful to product teams by keeping every action bounded, inspectable, and replayable.”
