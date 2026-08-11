# SignalLedger Cloud Integration Design

## Goal

Make the existing synthetic-data demo truthfully use CockroachDB Cloud for durable memory and Amazon S3 for its seed data when deployed to AWS Lambda, while preserving the zero-configuration SQLite development path.

## Architecture

The FastAPI routes keep their existing contract. A small storage boundary selects CockroachDB when `DATABASE_URL` is present and SQLite otherwise. On cloud startup, synthetic feedback is read from `s3://$S3_BUCKET/feedback.json` and inserted idempotently into CockroachDB. Decisions, analysis tasks, and evidence links are written to CockroachDB; the existing HNSW vector index remains available for semantic retrieval demonstrations.

CockroachDB Cloud Managed MCP Server is configured separately with a read-only SQL user. The application receives only its endpoint metadata for deployment evidence; application writes use the database connection string. No employer, customer, or personal data is accepted or seeded.

## Error handling and security

Missing cloud configuration falls back only in local development. A configured but unreachable database or S3 bucket fails visibly rather than silently claiming cloud persistence. Secrets are supplied through deployment parameters and never committed. The public API continues rejecting feedback unless `synthetic` is exactly `true`.

## Testing

Existing API tests cover the SQLite fallback. Additional focused tests cover S3 seed selection and ensure cloud configuration does not alter the public API contract. Deployment verification checks the public URL, CockroachDB rows and vector index, S3 object, Lambda configuration, and read-only MCP query.
