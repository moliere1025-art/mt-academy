-- MT Academy Schema for Cloudflare D1
-- Version 2.0 — 统一课程管理系统

PRAGMA foreign_keys = ON;

-- =============================================
-- 用户表
-- =============================================
DROP TABLE IF EXISTS submissions;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS assignments;
DROP TABLE IF EXISTS live_sessions;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  uid TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',          -- 'admin' | 'teacher' | 'student'
  membershipLevel TEXT NOT NULL DEFAULT 'Core',  -- 'Core' | 'Advanced' | 'Mastery' | 'Elite'
  isVerified INTEGER NOT NULL DEFAULT 0,
  avatar TEXT,
  learningGoal TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =============================================
-- 课程表
-- =============================================
CREATE TABLE courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  instructor TEXT NOT NULL,
  price REAL NOT NULL DEFAULT 0,
  description TEXT,
  category TEXT,
  level TEXT NOT NULL DEFAULT 'Core',            -- 课程所属层级
  duration TEXT,
  image TEXT,
  videoUrl TEXT,
  pdfUrl TEXT,
  modules TEXT DEFAULT '[]',                     -- JSON array of modules
  students INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =============================================
-- 选课 / 注册表（学生 ↔ 课程 多对多）
-- =============================================
CREATE TABLE enrollments (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  courseId TEXT NOT NULL,
  progress REAL NOT NULL DEFAULT 0,              -- 0–100 百分比
  lastLessonId TEXT,                             -- 上次学习到的章节
  enrolledAt TEXT NOT NULL DEFAULT (datetime('now')),
  completedAt TEXT,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE(userId, courseId)
);

-- =============================================
-- 作业表
-- =============================================
CREATE TABLE assignments (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  courseId TEXT NOT NULL,
  description TEXT,
  dueDate TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE
);

-- =============================================
-- 作业提交表
-- =============================================
CREATE TABLE submissions (
  id TEXT PRIMARY KEY,
  studentId TEXT NOT NULL,
  assignmentId TEXT NOT NULL,
  fileUrl TEXT,
  remark TEXT,
  grade TEXT,
  feedback TEXT,
  submittedAt TEXT NOT NULL DEFAULT (datetime('now')),
  gradedAt TEXT,
  FOREIGN KEY (studentId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assignmentId) REFERENCES assignments(id) ON DELETE CASCADE,
  UNIQUE(studentId, assignmentId)
);

-- =============================================
-- 直播 / 回放表
-- =============================================
CREATE TABLE live_sessions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT,
  time TEXT,
  instructor TEXT,
  status TEXT DEFAULT 'upcoming',                -- 'upcoming' | 'live' | 'ended'
  type TEXT DEFAULT 'live',                      -- 'live' | 'replay'
  replayUrl TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =============================================
-- 索引
-- =============================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_enrollments_user ON enrollments(userId);
CREATE INDEX idx_enrollments_course ON enrollments(courseId);
CREATE INDEX idx_assignments_course ON assignments(courseId);
CREATE INDEX idx_submissions_student ON submissions(studentId);
CREATE INDEX idx_submissions_assignment ON submissions(assignmentId);
CREATE INDEX idx_live_sessions_date ON live_sessions(date);
