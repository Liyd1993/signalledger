# SignalLedger Strands Agent Design

**Goal:** Turn SignalLedger into a Professional Agent entry for the Agents for Humans Hackathon without requiring an AWS account, payment method, or customer data.

## Product

SignalLedger is a product-feedback triage agent. A product manager asks a roadmap question. The agent retrieves only matching synthetic feedback, applies the existing transparent decision policy, and produces an evidence-backed recommendation plus a specific validation task. It records the result in the existing local decision ledger so later feedback can flag the recommendation for review.

## Architecture

The FastAPI app remains the only web service. A small `strands_agent.py` module creates a Strands `Agent` with an `OllamaModel` and two narrow custom tools: one tool retrieves synthetic feedback for a question and the other writes an approved analysis result to the local ledger. The existing deterministic policy is the tool's decision rule; this keeps decisions reproducible while the model plans the tool-use workflow and explains the result.

The agent uses the local `gemma4:12b` Ollama model at `http://127.0.0.1:11434`. There are no AWS credentials, cloud databases, external feedback sources, or personal data in the demo. If the local model is unavailable, the UI reports a clear configuration error rather than silently claiming an agent run occurred.

## API and UI

`POST /api/agent-analysis` accepts the existing `question` payload. It invokes the Strands agent and returns its tool-backed result, with the decision identifier and evidence IDs. The current analysis endpoint remains as a deterministic comparison/fallback demo; the UI's primary action calls the new agent endpoint and labels the model and tools used.

## Evidence and safeguards

- Accept synthetic feedback only; retain the existing API boundary rejecting other data.
- Limit retrieval to four evidence items and cite their IDs in each result.
- Keep the deterministic score and recommendation visible; the LLM cannot invent a decision or write arbitrary records.
- Use no browser, shell, file-editing, network, or cloud tools in the agent.

## Submission artifacts

Update the README, Devpost copy, architecture diagram, and five-minute demo script to identify the Strands SDK, Ollama model, tools, data boundary, and replayable demo path. The repository keeps an MIT license and all data stays synthetic.

## Verification

Tests will cover the two tool functions, agent configuration, API behavior, and the existing decision lifecycle. A local smoke run will invoke Strands against the installed Ollama model and capture the real tool-use output for the demo.
