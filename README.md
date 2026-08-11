# SignalLedger

SignalLedger is a local Strands agent for product-feedback triage. It turns a product question into a cited recommendation and a measurable validation experiment.

> This repository and every demo record contain **synthetic data only**. Do not add employer, customer, or personal data.

## How it is agentic

The FastAPI endpoint creates a Strands `Agent` backed by local Ollama (`gemma4:12b`). The agent has only two custom tools:

1. `retrieve_feedback` — returns at most four relevant synthetic feedback records.
2. `create_decision` — runs the transparent policy, cites feedback IDs, and returns `build_now` or `validate_first`.

The agent must call retrieval before decision. If it skips the required tool, the API returns an error instead of pretending an analysis happened. It has no browser, shell, file-editing, customer-data, cloud, or remote connector tools.

## Run locally

Prerequisites: Python 3.11+, [Ollama](https://ollama.com/), and the `gemma4:12b` model.

```bash
ollama serve
ollama pull gemma4:12b
uv sync --dev
uv run pytest -q
uv run uvicorn signalledger.app:app --reload
```

Open http://127.0.0.1:8000. Click **Run the feedback agent**, then **Add new enterprise evidence**, and run the agent again. The history shows why the earlier decision needs review.

## No paid or cloud setup

SignalLedger runs with a local Ollama model. It needs no AWS account, credit card, cloud database, API key, or production deployment for the demo.

## Demo question

“Should we build scheduled CSV exports?”

The agent retrieves recurring high-severity reporting feedback and recommends a constrained version with audit logs for five enterprise accounts. The validation metric is a 50% reduction in manual export time.

## Hackathon entry

Built for the Agents for Humans Hackathon, Professional Agents track. See [`docs/architecture.md`](docs/architecture.md), [`docs/devpost-submission.md`](docs/devpost-submission.md), and [`docs/demo-script.md`](docs/demo-script.md) for the architecture, Devpost copy, and recording script.
