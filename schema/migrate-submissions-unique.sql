-- Incremental migration: submission uniqueness + role comment (safe to re-run)
-- Usage:
--   npm run db:migrate:submissions:local
--   npm run db:migrate:submissions

PRAGMA foreign_keys = ON;

-- D1/SQLite cannot ADD CONSTRAINT easily; recreate unique index instead.
CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_student_assignment
  ON submissions(studentId, assignmentId);
