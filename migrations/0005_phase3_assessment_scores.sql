CREATE TABLE IF NOT EXISTS assessment_scores (
  id TEXT PRIMARY KEY,
  assessment_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  score DOUBLE PRECISION NOT NULL,
  feedback TEXT,
  approval_status TEXT NOT NULL DEFAULT 'DRAFT',
  entered_by TEXT NOT NULL,
  entered_at TEXT NOT NULL,
  approved_by TEXT,
  approved_at TEXT,
  updated_at TEXT NOT NULL,
  tenant_id TEXT NOT NULL DEFAULT 'default'
);