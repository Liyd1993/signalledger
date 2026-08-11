# SignalLedger three-minute demo script

## 0:00–0:20 — Problem

“Product teams receive feedback everywhere, but a roadmap decision often loses its evidence. SignalLedger is a persistent decision memory: it shows what customers said, what we decided, and when new evidence means we should revisit that decision. Every record in this demo is synthetic.”

## 0:20–1:25 — First decision

Open the dashboard. Click **Analyze scheduled exports**. Read the `build now` recommendation and point to the confidence score. Scroll through the cited evidence: operations, analytics, support, and executive feedback. Explain: “The agent did not start with a conclusion. It retrieved relevant feedback and requires at least two sources before it can recommend building.” Point to the validation experiment: five enterprise accounts, scheduled exports with audit logs, and a 50% reduction in manual preparation time.

## 1:25–2:15 — Memory and re-evaluation

Show Decision history with a `current` record. Click **Add new enterprise evidence** and highlight the compliance request. Show that the existing decision immediately becomes `needs review`. Click **Re-run analysis** and explain that the new run creates a successor decision grounded in the expanded evidence ledger.

## 2:15–2:55 — Technical proof

Show `migrations/001_schema.sql`: feedback memory has a CockroachDB vector column and HNSW index; decisions and evidence links persist separately. In CockroachDB Cloud, show the cluster and the read-only Managed MCP Server endpoint/configuration. In AWS, show the Lambda function and S3 bucket containing only synthetic seed data. Close with: “SignalLedger turns memory into a product decision that can be audited, challenged, and improved over time.”
