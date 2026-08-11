# SignalLedger — Devpost submission copy

## Inspiration

Product decisions usually disappear into a mix of calls, spreadsheets, and one-off summaries. Months later, teams cannot explain why they chose to build something—or whether the evidence has changed. We built SignalLedger to give product managers durable, inspectable memory for customer signals and the decisions made from them.

## What it does

SignalLedger ingests synthetic customer feedback, retrieves the evidence most relevant to a product question, and creates a recommendation with citations and a measurable validation experiment. It saves that decision as a memory record. When a new enterprise signal arrives, it marks the existing decision for review so the next analysis explains what changed.

Our demo asks: **Should we build scheduled CSV exports?** The agent finds recurring, high-severity feedback across operations, support, analysts, and compliance. It recommends building a constrained first version with audit logs and a five-account validation metric. When new compliance feedback appears, the decision history records why the existing conclusion needs review.

## How we built it

SignalLedger uses CockroachDB as its persistent memory layer for feedback, evidence links, asynchronous task state, and decision history. We use CockroachDB Distributed Vector Indexing for semantic retrieval of feedback, and CockroachDB Cloud Managed MCP Server as the agent's read-only, auditable memory-query boundary.

The deployment runs the application on AWS Lambda, stores the synthetic source set in Amazon S3, and can use Amazon Bedrock to generate grounded recommendation wording. The deterministic decision policy remains responsible for status and evidence selection so every conclusion is traceable.

## Challenges we ran into

The key product challenge was avoiding a generic chatbot. We made “not enough evidence” a first-class outcome: the agent will return `validate_first` rather than confidently inventing a roadmap answer when it cannot cite at least two relevant signals.

## Accomplishments that we're proud of

- A complete feedback → evidence → decision → re-evaluation loop in one compact demo.
- Clear separation between raw feedback, semantic memory, and decision memory.
- Decisions become living records instead of stale summaries.
- A synthetic-only data boundary suitable for a public hackathon repository.

## What we learned

Persistent memory is most useful when it captures not only facts, but also the reasoning and uncertainty behind a decision. The best agentic product behavior is often knowing when to ask for validation rather than producing a stronger-sounding answer.

## What's next

We would add role-aware connectors for research transcripts and support tools, decision ownership, and explicit human approval workflows—without allowing the agent to take irreversible roadmap actions.

## Built with

CockroachDB Cloud, CockroachDB Distributed Vector Indexing, CockroachDB Managed MCP Server, AWS Lambda, Amazon S3, Amazon Bedrock, FastAPI, Python, vanilla JavaScript.
