-- Production incremental migration (NO DROP)
-- Align remote D1 with app expectations.

PRAGMA foreign_keys = ON;

-- Enrollments (missing on remote)
CREATE TABLE IF NOT EXISTS enrollments (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  courseId TEXT NOT NULL,
  progress REAL NOT NULL DEFAULT 0,
  lastLessonId TEXT,
  enrolledAt TEXT NOT NULL DEFAULT (datetime('now')),
  completedAt TEXT,
  UNIQUE(userId, courseId)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(userId);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(courseId);

-- Assignments: add description + createdAt if missing (SQLite ignores duplicate add errors via separate statements carefully)
-- D1 supports ADD COLUMN; re-running fails if exists — use try via separate migration steps if needed.

-- Submissions uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_student_assignment
  ON submissions(studentId, assignmentId);

CREATE INDEX IF NOT EXISTS idx_assignments_course ON assignments(courseId);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(studentId);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignmentId);

-- Normalize Chinese membership labels used by older seed
UPDATE users SET membershipLevel = 'Core' WHERE membershipLevel IN ('初级', '基础', '入门', 'Core');
UPDATE users SET membershipLevel = 'Advanced' WHERE membershipLevel IN ('中级', '进阶', 'Advanced');
UPDATE users SET membershipLevel = 'Mastery' WHERE membershipLevel IN ('高级', '高阶', '精通', 'Mastery');
UPDATE users SET membershipLevel = 'Elite' WHERE membershipLevel IN ('认证', '职业认证', 'Elite');
