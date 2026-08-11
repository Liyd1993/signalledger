# SignalLedger

SignalLedger is an evidence-backed product-decision agent. It turns synthetic customer feedback into a recommendation, stores the evidence and rationale as durable memory, and flags an earlier decision when new evidence should change it.

> This repository and its demo records contain **synthetic data only**. Do not add employer, customer, or personal data.

## Why it is agentic

For each question, SignalLedger retrieves relevant feedback, evaluates whether there is sufficient evidence, produces a validation experiment, and writes a durable decision record. New feedback marks active decisions for review, so the next run explains what changed instead of pretending every question starts from zero.

## CockroachDB × AWS Hackathon requirements

- **CockroachDB persistent memory:** feedback, task state, decisions, and evidence references are durable tables.
- **CockroachDB Distributed Vector Indexing:** `migrations/001_schema.sql` defines a vector column and HNSW index for semantic feedback retrieval.
- **CockroachDB Managed MCP Server:** set `COCKROACH_MCP_URL` to the read-only managed endpoint. The deployment uses it as the agent's auditable memory-query boundary; application writes remain least-privilege database operations.
- **AWS:** the AWS SAM template deploys the service as Lambda and limits it to read-only access to the S3 seed-data bucket. Bedrock is the optional wording model in production; the local deterministic policy keeps the demo repeatable.

## Run locally

```bash
uv sync --dev
uv run pytest -q
uv run uvicorn signalledger.app:app --reload
```

Open http://127.0.0.1:8000. Click **Analyze scheduled exports**, then **Add new enterprise evidence**, and run the analysis again. The decision history shows the durable memory lifecycle.

## Deploy

1. Create a CockroachDB Cloud cluster and apply `migrations/001_schema.sql`.
2. Create a read-only CockroachDB Cloud Managed MCP Server endpoint and save its URL as `COCKROACH_MCP_URL`.
3. Create an S3 bucket, upload `data/feedback.json`, and deploy:

```bash
sam build
sam deploy --guided
```

Supply the CockroachDB connection as the `DatabaseUrl` parameter and the S3 bucket as `SeedBucket`. Do not commit either value. Capture the Cloud console, Lambda configuration, CockroachDB vector query, and MCP invocation in the demo video.

## Product demonstration

Question: “Should we build scheduled CSV exports?”

SignalLedger initially recommends building because it finds multiple high-severity, enterprise feedback records. A new compliance request is then imported; the prior decision is marked for review, and a re-run produces a new decision based on the expanded evidence ledger.
