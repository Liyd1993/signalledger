# SignalLedger Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Execute this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish, deploy, demonstrate, and submit SignalLedger with verifiable CockroachDB and AWS integrations.

**Architecture:** Preserve SQLite locally and use CockroachDB plus S3 when cloud environment variables are present. Publish a clean public GitHub repository, deploy through AWS SAM, record an English demo, and submit verified public links to Devpost.

**Tech Stack:** Python 3.11/3.12, FastAPI, CockroachDB Cloud, CockroachDB Managed MCP Server, AWS Lambda, S3, SAM, GitHub, Devpost.

## Global Constraints

- Synthetic data only; never use company or real customer data.
- Never commit `.venv`, `.local`, `.env`, credentials, or cloud connection strings.
- Retain the MIT License.
- Demo video must be public, English, and shorter than three minutes.

---

### Task 1: Verify and harden cloud storage

**Files:** Modify `pyproject.toml`, `src/signalledger/app.py`, `migrations/001_schema.sql`, `template.yaml`; test with `tests/`.

- [ ] Rebuild the local virtual environment and run `uv sync --dev && uv run pytest -q`.
- [ ] Add CockroachDB-backed decisions, tasks, evidence, and synthetic feedback while retaining SQLite locally.
- [ ] Load `feedback.json` from S3 in AWS and seed CockroachDB idempotently.
- [ ] Run all tests and a local HTTP smoke test.

### Task 2: Publish source

**Files:** All tracked project files except ignored runtime state.

- [ ] Scan tracked candidates for credentials and synthetic-data violations.
- [ ] Initialize an isolated Git repository, commit, create public GitHub repository `signalledger`, and push `main`.
- [ ] Verify the repository is public and MIT License is visible.

### Task 3: Provision CockroachDB and AWS

- [ ] Create or reuse a CockroachDB Cloud cluster and run `migrations/001_schema.sql`.
- [ ] Create a read-only SQL identity and CockroachDB Managed MCP Server.
- [ ] Create an S3 bucket, upload only `data/feedback.json`, and deploy the Lambda/SAM stack.
- [ ] Verify public API behavior and cloud persistence.

### Task 4: Demo and Devpost

**Files:** Read `docs/demo-script.md`, `docs/devpost-submission.md`; upload `docs/demo-screenshot.png`.

- [ ] Record an English video under three minutes showing the decision lifecycle and cloud evidence.
- [ ] Upload it publicly and verify GitHub, demo, and video URLs anonymously.
- [ ] Fill Devpost in English, explicitly describe vector indexing, Managed MCP Server, Lambda, and S3, then submit.
- [ ] Report all final URLs and any incomplete item.
