-- Production seed users (password for all: 123456)
-- Only replaces these three seed accounts.

PRAGMA foreign_keys = ON;

DELETE FROM submissions WHERE studentId IN ('admin-prod', 'teacher-prod', 'student-prod');
DELETE FROM enrollments WHERE userId IN ('admin-prod', 'teacher-prod', 'student-prod');
DELETE FROM users WHERE id IN ('admin-prod', 'teacher-prod', 'student-prod')
  OR email IN ('admin@mt.com', 'teacher@mt.com', 'student@mt.com');

INSERT INTO users (id, uid, email, password, name, role, membershipLevel, isVerified, learningGoal, createdAt)
VALUES
  (
    'admin-prod',
    'admin-prod',
    'admin@mt.com',
    '$2b$10$RVPBlgFinV/CIsgW5QKQv.kF9krS5JZiUMW1OgnEKhmmh/hQuFPey',
    '管理员',
    'admin',
    'Elite',
    1,
    '管理课程内容、学生权限与直播安排。',
    datetime('now')
  ),
  (
    'teacher-prod',
    'teacher-prod',
    'teacher@mt.com',
    '$2b$10$e.kt.Q4nw9xcznPdXbHfR.Ec6JjZnv1tTzcL2OQrKHJRz.F.kPmMG',
    '授课老师',
    'teacher',
    'Elite',
    1,
    '发布课程资料、布置作业并批改提交。',
    datetime('now')
  ),
  (
    'student-prod',
    'student-prod',
    'student@mt.com',
    '$2b$10$k15Ol3NqUoVUtsb5Ik5npehSD.jTOhAmZ5rklWRNtjLGI6MZAvjCG',
    '演示学生',
    'student',
    'Advanced',
    1,
    '完成课程学习并按时提交作业。',
    datetime('now')
  );
