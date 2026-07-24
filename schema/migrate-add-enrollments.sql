-- Migration: Add enrollments table (safe — IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS enrollments (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  courseId TEXT NOT NULL,
  progress REAL NOT NULL DEFAULT 0,
  lastLessonId TEXT,
  enrolledAt TEXT NOT NULL DEFAULT (datetime('now')),
  completedAt TEXT,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE(userId, courseId)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(userId);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(courseId);
