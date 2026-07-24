-- MT Academy — 4门 Wyckoff 课程种子数据
-- 每门课程包含完整模块列表，每个模块预留视频位（videoUrl 为空字符串）

-- 按外键依赖顺序清理：子表先删，父表后删
DELETE FROM submissions;
DELETE FROM assignments;
DELETE FROM courses;

-- =============================================
-- 课程 1: Wyckoff 2.0 原版课程（30课）
-- =============================================
INSERT INTO courses (id, title, instructor, price, description, category, level, duration, image, videoUrl, pdfUrl, modules, students)
VALUES (
  'course-1',
  'Wyckoff 2.0 原版课程',
  'MT',
  4999,
  '威科夫 2.0 原版完整课程，涵盖市场结构、量价分析、交易计划制定等核心内容。',
  'Wyckoff 核心',
  'Core',
  '30h',
  'https://images.unsplash.com/photo-1642790106117-e829e14a795f?q=80&w=400&auto=format&fit=crop',
  NULL, NULL,
  '[{"id":"w2-01","title":"第一课","duration":"45:00","videoUrl":""},{"id":"w2-02","title":"第二课","duration":"50:00","videoUrl":""},{"id":"w2-03","title":"第三课","duration":"48:00","videoUrl":""},{"id":"w2-04","title":"第四课","duration":"52:00","videoUrl":""},{"id":"w2-05","title":"第五课","duration":"46:00","videoUrl":""},{"id":"w2-06","title":"第六课","duration":"55:00","videoUrl":""},{"id":"w2-07","title":"第七课","duration":"42:00","videoUrl":""},{"id":"w2-08","title":"第八课","duration":"58:00","videoUrl":""},{"id":"w2-09","title":"第九课","duration":"50:00","videoUrl":""},{"id":"w2-10","title":"第十课","duration":"47:00","videoUrl":""},{"id":"w2-11","title":"第十一课","duration":"53:00","videoUrl":""},{"id":"w2-12","title":"第十二课","duration":"49:00","videoUrl":""},{"id":"w2-13","title":"第十三课","duration":"51:00","videoUrl":""},{"id":"w2-14","title":"第十四课","duration":"44:00","videoUrl":""},{"id":"w2-15","title":"第十五课","duration":"56:00","videoUrl":""},{"id":"w2-16","title":"第十六课","duration":"48:00","videoUrl":""},{"id":"w2-17","title":"第十七课","duration":"52:00","videoUrl":""},{"id":"w2-18","title":"第十八课","duration":"45:00","videoUrl":""},{"id":"w2-19","title":"第十九课","duration":"50:00","videoUrl":""},{"id":"w2-20","title":"第二十课","duration":"54:00","videoUrl":""},{"id":"w2-21","title":"第二十一课","duration":"47:00","videoUrl":""},{"id":"w2-22","title":"第二十二课","duration":"51:00","videoUrl":""},{"id":"w2-23","title":"第二十三课","duration":"49:00","videoUrl":""},{"id":"w2-24","title":"第二十四课","duration":"53:00","videoUrl":""},{"id":"w2-25","title":"第二十五课","duration":"46:00","videoUrl":""},{"id":"w2-26","title":"第二十六课","duration":"55:00","videoUrl":""},{"id":"w2-27","title":"第二十七课","duration":"48:00","videoUrl":""},{"id":"w2-28","title":"第二十八课","duration":"50:00","videoUrl":""},{"id":"w2-29","title":"第二十九课","duration":"52:00","videoUrl":""},{"id":"w2-30","title":"第三十课","duration":"57:00","videoUrl":""}]',
  0
);

-- =============================================
-- 课程 2: Wyckoff 2.0 Spring（10课）
-- =============================================
INSERT INTO courses (id, title, instructor, price, description, category, level, duration, image, videoUrl, pdfUrl, modules, students)
VALUES (
  'course-2',
  'Wyckoff 2.0 Spring',
  'MT',
  3999,
  '威科夫 2.0 Spring 专题课程，深入讲解 Spring 形态识别、确认与交易执行。',
  'Wyckoff 专题',
  'Advanced',
  '10h',
  'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=400&auto=format&fit=crop',
  NULL, NULL,
  '[{"id":"sp-01","title":"第一课","duration":"50:00","videoUrl":""},{"id":"sp-02","title":"第二课","duration":"48:00","videoUrl":""},{"id":"sp-03","title":"第三课","duration":"52:00","videoUrl":""},{"id":"sp-04","title":"第四课","duration":"45:00","videoUrl":""},{"id":"sp-05","title":"第五课","duration":"55:00","videoUrl":""},{"id":"sp-06","title":"第六课","duration":"47:00","videoUrl":""},{"id":"sp-07","title":"第七课","duration":"51:00","videoUrl":""},{"id":"sp-08","title":"第八课","duration":"49:00","videoUrl":""},{"id":"sp-09","title":"第九课","duration":"53:00","videoUrl":""},{"id":"sp-10","title":"第十课","duration":"50:00","videoUrl":""}]',
  0
);

-- =============================================
-- 课程 3: Wyckoff 2.0 Upthrust（10课）
-- =============================================
INSERT INTO courses (id, title, instructor, price, description, category, level, duration, image, videoUrl, pdfUrl, modules, students)
VALUES (
  'course-3',
  'Wyckoff 2.0 Upthrust',
  'MT',
  3999,
  '威科夫 2.0 Upthrust 专题课程，系统学习 Upthrust 形态的识别、验证与实战应用。',
  'Wyckoff 专题',
  'Advanced',
  '10h',
  'https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?q=80&w=400&auto=format&fit=crop',
  NULL, NULL,
  '[{"id":"ut-01","title":"第一课","duration":"48:00","videoUrl":""},{"id":"ut-02","title":"第二课","duration":"52:00","videoUrl":""},{"id":"ut-03","title":"第三课","duration":"45:00","videoUrl":""},{"id":"ut-04","title":"第四课","duration":"50:00","videoUrl":""},{"id":"ut-05","title":"第五课","duration":"55:00","videoUrl":""},{"id":"ut-06","title":"第六课","duration":"47:00","videoUrl":""},{"id":"ut-07","title":"第七课","duration":"51:00","videoUrl":""},{"id":"ut-08","title":"第八课","duration":"49:00","videoUrl":""},{"id":"ut-09","title":"第九课","duration":"53:00","videoUrl":""},{"id":"ut-10","title":"第十课","duration":"50:00","videoUrl":""}]',
  0
);

-- =============================================
-- 课程 4: Wyckoff 2.0 综合运用以及复习（5课）
-- =============================================
INSERT INTO courses (id, title, instructor, price, description, category, level, duration, image, videoUrl, pdfUrl, modules, students)
VALUES (
  'course-4',
  'Wyckoff 2.0 综合运用以及复习',
  'MT',
  2999,
  '威科夫 2.0 综合运用与复习课程，整合所有知识点进行实战复盘与综合练习。',
  'Wyckoff 综合',
  'Mastery',
  '5h',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=400&auto=format&fit=crop',
  NULL, NULL,
  '[{"id":"rev-01","title":"第一课","duration":"50:00","videoUrl":""},{"id":"rev-02","title":"第二课","duration":"48:00","videoUrl":""},{"id":"rev-03","title":"第三课","duration":"52:00","videoUrl":""},{"id":"rev-04","title":"第四课","duration":"55:00","videoUrl":""},{"id":"rev-05","title":"第五课","duration":"50:00","videoUrl":""}]',
  0
);

-- =============================================
-- 配套作业（相对日期：当前日期 + N 天，避免一进来全过期）
-- =============================================
INSERT INTO assignments (id, title, courseId, description, dueDate) VALUES
  ('assign-1', 'Wyckoff 2.0 原版课程作业一', 'course-1', '完成第一阶段量价分析练习', date('now', '+14 days')),
  ('assign-2', 'Spring 形态识别练习', 'course-2', '提交 Spring 形态标注截图', date('now', '+21 days')),
  ('assign-3', 'Upthrust 实战分析', 'course-3', '选择一只标的完成 Upthrust 复盘', date('now', '+28 days')),
  ('assign-4', '综合运用复盘报告', 'course-4', '提交综合交易计划与复盘报告', date('now', '+35 days'));
