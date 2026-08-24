# SignalLedger — Devpost submission copy

## Inspiration

Product teams receive feedback everywhere, but decisions often outlive the evidence behind them. SignalLedger gives product managers a small, inspectable agent that can turn a roadmap question into a cited recommendation and a concrete next validation step.

## What it does

Ask “Should we build scheduled CSV exports?” SignalLedger's Strands agent first retrieves the most relevant synthetic feedback, then calls a separate decision tool. The result cites the exact feedback IDs, recommends either `build_now` or `validate_first`, and gives a measurable experiment. New synthetic feedback flags the current decision for review, so the next run has to account for what changed.

## How we built it

SignalLedger is a Python/FastAPI app using the Strands Agents SDK. Its local `gemma4:12b` Ollama model plans a two-tool workflow: `retrieve_feedback` is read-only and limited to four synthetic records; `create_decision` runs a transparent, deterministic policy and returns the evidence-backed outcome. The UI shows the provider, model, and tools used for each run rather than hiding the agent behind a generic chat interface.

All demonstration data is synthetic. The project requires no cloud account, payment method, API key, external connector, browser, shell, or file-writing tool.

## Challenges we ran into

We wanted the project to be agentic without allowing the model to invent product evidence or take irreversible actions. The narrow tools and the deterministic decision policy make the model's role visible: it chooses and executes the workflow, while the product rules remain replayable.

## Accomplishments that we're proud of

- A genuine local Strands + Ollama tool-use path, not a chatbot mock-up.
- An evidence → decision → review loop that a product manager can understand in one screen.
- Synthetic-only data and zero paid/cloud prerequisites.
- The agent can deliberately return `validate_first` when evidence is weak.

## What we learned

For professional work, trust comes from bounded autonomy. A useful product agent should show the data boundary, the tools it used, and the decision rule—not merely produce fluent prose.

## What's next

We would add approved connectors for support and interview repositories, per-product access controls, and a human approval queue before any real roadmap action.

## Built with

Strands Agents SDK, Ollama, Gemma 4, FastAPI, Python, SQLite, vanilla JavaScript.
