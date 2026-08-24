CREATE TABLE IF NOT EXISTS feedback_items (
  id STRING PRIMARY KEY,
  source STRING NOT NULL DEFAULT 'synthetic_seed',
  persona STRING NOT NULL,
  account_tier STRING NOT NULL,
  received_at DATE NOT NULL,
  text STRING NOT NULL,
  severity INT NOT NULL,
  embedding VECTOR(8)
);
CREATE INDEX IF NOT EXISTS feedback_embedding_idx ON feedback_items USING HNSW (embedding vector_l2_ops);
CREATE TABLE IF NOT EXISTS analysis_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), question STRING NOT NULL,
  status STRING NOT NULL, result JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), completed_at TIMESTAMPTZ, error_message STRING
);
CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), question STRING NOT NULL, recommendation STRING NOT NULL,
  confidence INT NOT NULL, rationale STRING NOT NULL, review_status STRING NOT NULL,
  validation_experiment STRING NOT NULL DEFAULT '', change_reason STRING NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), supersedes_decision_id UUID
);
CREATE TABLE IF NOT EXISTS decision_evidence (
  decision_id UUID NOT NULL, feedback_id STRING NOT NULL, relevance_score FLOAT8 NOT NULL, claim STRING NOT NULL,
  PRIMARY KEY (decision_id, feedback_id)
);
ALTER TABLE analysis_tasks ADD COLUMN IF NOT EXISTS result JSONB;
ALTER TABLE decisions ADD COLUMN IF NOT EXISTS validation_experiment STRING NOT NULL DEFAULT '';
ALTER TABLE decisions ADD COLUMN IF NOT EXISTS change_reason STRING NOT NULL DEFAULT '';
