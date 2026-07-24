// Mock D1 for development
const PRE_HASHED_PASSWORD = "$2b$10$jjaT1K7ARBy/d/ZE0foypelKzW3bOwRHeg.GAL/f1ayerz5zWEuZm"; // "password123"

export const mockStore: Record<string, any[]> = {
  users: [
    {
      id: "admin-1",
      uid: "admin-1",
      email: "admin@wyckoff.com",
      password: PRE_HASHED_PASSWORD, 
      name: "管理员",
      role: "admin",
      isVerified: 1,
      createdAt: new Date().toISOString()
    },
    {
      id: "student-1",
      uid: "student-1",
      email: "student@wyckoff.com",
      password: PRE_HASHED_PASSWORD, 
      name: "学生用户",
      role: "student",
      isVerified: 1,
      createdAt: new Date().toISOString()
    },
    {
      id: "moliere-1",
      uid: "moliere-1",
      email: "moliere1025@gmail.com",
      password: PRE_HASHED_PASSWORD, 
      name: "Moliere",
      role: "student",
      isVerified: 1,
      createdAt: new Date().toISOString()
    }
  ],
  courses: [
    {
      id: "course-1",
      title: "Wyckoff 2.0 原版课程",
      instructor: "MT",
      price: 4999,
      description: "威科夫 2.0 原版完整课程，涵盖市场结构、量价分析、交易计划制定等核心内容。",
      category: "Wyckoff 核心",
      level: "Core",
      duration: "30h",
      image: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?q=80&w=400&auto=format&fit=crop",
      progress: 0,
      modules: JSON.stringify([
        { id: "w2-01", title: "第一课", duration: "45:00", videoUrl: "" },
        { id: "w2-02", title: "第二课", duration: "50:00", videoUrl: "" },
        { id: "w2-03", title: "第三课", duration: "48:00", videoUrl: "" },
        { id: "w2-04", title: "第四课", duration: "52:00", videoUrl: "" },
        { id: "w2-05", title: "第五课", duration: "46:00", videoUrl: "" },
        { id: "w2-06", title: "第六课", duration: "55:00", videoUrl: "" },
        { id: "w2-07", title: "第七课", duration: "42:00", videoUrl: "" },
        { id: "w2-08", title: "第八课", duration: "58:00", videoUrl: "" },
        { id: "w2-09", title: "第九课", duration: "50:00", videoUrl: "" },
        { id: "w2-10", title: "第十课", duration: "47:00", videoUrl: "" },
        { id: "w2-11", title: "第十一课", duration: "53:00", videoUrl: "" },
        { id: "w2-12", title: "第十二课", duration: "49:00", videoUrl: "" },
        { id: "w2-13", title: "第十三课", duration: "51:00", videoUrl: "" },
        { id: "w2-14", title: "第十四课", duration: "44:00", videoUrl: "" },
        { id: "w2-15", title: "第十五课", duration: "56:00", videoUrl: "" },
        { id: "w2-16", title: "第十六课", duration: "48:00", videoUrl: "" },
        { id: "w2-17", title: "第十七课", duration: "52:00", videoUrl: "" },
        { id: "w2-18", title: "第十八课", duration: "45:00", videoUrl: "" },
        { id: "w2-19", title: "第十九课", duration: "50:00", videoUrl: "" },
        { id: "w2-20", title: "第二十课", duration: "54:00", videoUrl: "" },
        { id: "w2-21", title: "第二十一课", duration: "47:00", videoUrl: "" },
        { id: "w2-22", title: "第二十二课", duration: "51:00", videoUrl: "" },
        { id: "w2-23", title: "第二十三课", duration: "49:00", videoUrl: "" },
        { id: "w2-24", title: "第二十四课", duration: "53:00", videoUrl: "" },
        { id: "w2-25", title: "第二十五课", duration: "46:00", videoUrl: "" },
        { id: "w2-26", title: "第二十六课", duration: "55:00", videoUrl: "" },
        { id: "w2-27", title: "第二十七课", duration: "48:00", videoUrl: "" },
        { id: "w2-28", title: "第二十八课", duration: "50:00", videoUrl: "" },
        { id: "w2-29", title: "第二十九课", duration: "52:00", videoUrl: "" },
        { id: "w2-30", title: "第三十课", duration: "57:00", videoUrl: "" }
      ]),
      createdAt: new Date().toISOString()
    },
    {
      id: "course-2",
      title: "Wyckoff 2.0 Spring",
      instructor: "MT",
      price: 3999,
      description: "威科夫 2.0 Spring 专题课程，深入讲解 Spring 形态识别、确认与交易执行。",
      category: "Wyckoff 专题",
      level: "Advanced",
      duration: "10h",
      image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=400&auto=format&fit=crop",
      progress: 0,
      modules: JSON.stringify([
        { id: "sp-01", title: "第一课", duration: "50:00", videoUrl: "" },
        { id: "sp-02", title: "第二课", duration: "48:00", videoUrl: "" },
        { id: "sp-03", title: "第三课", duration: "52:00", videoUrl: "" },
        { id: "sp-04", title: "第四课", duration: "45:00", videoUrl: "" },
        { id: "sp-05", title: "第五课", duration: "55:00", videoUrl: "" },
        { id: "sp-06", title: "第六课", duration: "47:00", videoUrl: "" },
        { id: "sp-07", title: "第七课", duration: "51:00", videoUrl: "" },
        { id: "sp-08", title: "第八课", duration: "49:00", videoUrl: "" },
        { id: "sp-09", title: "第九课", duration: "53:00", videoUrl: "" },
        { id: "sp-10", title: "第十课", duration: "50:00", videoUrl: "" }
      ]),
      createdAt: new Date().toISOString()
    },
    {
      id: "course-3",
      title: "Wyckoff 2.0 Upthrust",
      instructor: "MT",
      price: 3999,
      description: "威科夫 2.0 Upthrust 专题课程，系统学习 Upthrust 形态的识别、验证与实战应用。",
      category: "Wyckoff 专题",
      level: "Advanced",
      duration: "10h",
      image: "https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?q=80&w=400&auto=format&fit=crop",
      progress: 0,
      modules: JSON.stringify([
        { id: "ut-01", title: "第一课", duration: "48:00", videoUrl: "" },
        { id: "ut-02", title: "第二课", duration: "52:00", videoUrl: "" },
        { id: "ut-03", title: "第三课", duration: "45:00", videoUrl: "" },
        { id: "ut-04", title: "第四课", duration: "50:00", videoUrl: "" },
        { id: "ut-05", title: "第五课", duration: "55:00", videoUrl: "" },
        { id: "ut-06", title: "第六课", duration: "47:00", videoUrl: "" },
        { id: "ut-07", title: "第七课", duration: "51:00", videoUrl: "" },
        { id: "ut-08", title: "第八课", duration: "49:00", videoUrl: "" },
        { id: "ut-09", title: "第九课", duration: "53:00", videoUrl: "" },
        { id: "ut-10", title: "第十课", duration: "50:00", videoUrl: "" }
      ]),
      createdAt: new Date().toISOString()
    },
    {
      id: "course-4",
      title: "Wyckoff 2.0 综合运用以及复习",
      instructor: "MT",
      price: 2999,
      description: "威科夫 2.0 综合运用与复习课程，整合所有知识点进行实战复盘与综合练习。",
      category: "Wyckoff 综合",
      level: "Mastery",
      duration: "5h",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=400&auto=format&fit=crop",
      progress: 0,
      modules: JSON.stringify([
        { id: "rev-01", title: "第一课", duration: "50:00", videoUrl: "" },
        { id: "rev-02", title: "第二课", duration: "48:00", videoUrl: "" },
        { id: "rev-03", title: "第三课", duration: "52:00", videoUrl: "" },
        { id: "rev-04", title: "第四课", duration: "55:00", videoUrl: "" },
        { id: "rev-05", title: "第五课", duration: "50:00", videoUrl: "" }
      ]),
      createdAt: new Date().toISOString()
    }
  ],
  submissions: [],
  live_sessions: [
    {
      id: "live-1",
      title: "机构级盘面深度拆解：吸筹区间识别",
      date: "2026-04-10",
      time: "20:00",
      instructor: "李老师",
      status: "upcoming",
      type: "workshop"
    }
  ],
  assignments: [
    { id: "assign-1", title: "Wyckoff 2.0 原版课程作业一", courseId: "course-1", dueDate: "2026-05-20", course: "Wyckoff 核心", status: "not_submitted" },
    { id: "assign-2", title: "Spring 形态识别练习", courseId: "course-2", dueDate: "2026-05-25", course: "Wyckoff 专题", status: "not_submitted" },
    { id: "assign-3", title: "Upthrust 实战分析", courseId: "course-3", dueDate: "2026-05-30", course: "Wyckoff 专题", status: "not_submitted" },
    { id: "assign-4", title: "综合运用复盘报告", courseId: "course-4", dueDate: "2026-06-05", course: "Wyckoff 综合", status: "not_submitted" }
  ],
  certifications: [],
  applications: [],
  notifications: [
    { id: "1", title: "系统更新", message: "MT TRADING STUDIO 2.0 现已发布！", type: "info", read: false, createdAt: new Date().toISOString() },
    { id: "2", title: "直播提醒", message: "您预约的《机构级订单流》直播将在 30 分钟后开始。", type: "warning", read: false, createdAt: new Date().toISOString() }
  ],
  community_posts: [
    {
      id: "post-1",
      authorId: "student-1",
      authorName: "Sarah Jenkins",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400&auto=format&fit=crop",
      title: "分享一个实用的 VSA 指标配置方案",
      content: "在 TradingView 中结合成交量与价差，可以更清晰地看到供应枯竭的信号。这里是我的配置参数...",
      category: "工具分享",
      likes: 56,
      comments: 8,
      tags: ["VSA", "TradingView", "Indicators"],
      createdAt: new Date().toISOString()
    }
  ],
  schedule: []
};

export const mockStoreDB = {
  prepare: (sql: string) => {
    const lowerSql = sql.toLowerCase();
    const tableName = lowerSql.includes("from users") || lowerSql.includes("into users") || lowerSql.includes("update users") ? "users" :
                      lowerSql.includes("from courses") || lowerSql.includes("into courses") || lowerSql.includes("update courses") ? "courses" :
                      lowerSql.includes("from submissions") || lowerSql.includes("into submissions") || lowerSql.includes("update submissions") ? "submissions" :
                      lowerSql.includes("from live_sessions") || lowerSql.includes("into live_sessions") || lowerSql.includes("update live_sessions") || lowerSql.includes("delete from live_sessions") ? "live_sessions" :
                      lowerSql.includes("from assignments") || lowerSql.includes("into assignments") || lowerSql.includes("update assignments") || lowerSql.includes("delete from assignments") ? "assignments" :
                      lowerSql.includes("from certifications") || lowerSql.includes("into certifications") ? "certifications" :
                      lowerSql.includes("from applications") || lowerSql.includes("into applications") || lowerSql.includes("update applications") ? "applications" :
                      lowerSql.includes("from notifications") ? "notifications" :
                      lowerSql.includes("from community_posts") || lowerSql.includes("into community_posts") ? "community_posts" :
                      lowerSql.includes("from schedule") || lowerSql.includes("into schedule") ? "schedule" : "unknown";

    const statement = {
      bind: (...args: any[]) => {
        statement.args = args;
        return statement;
      },
      args: [] as any[],
      first: async (key?: string) => {
        if (key === "count" || lowerSql.includes("count(*)")) {
          return { count: mockStore[tableName]?.length || 0 };
        }

        if (lowerSql.includes("where email = ?")) {
          const email = statement.args[0];
          return mockStore.users.find(u => u.email === email) || null;
        }

        if (lowerSql.includes("where id = ?")) {
          const id = statement.args[0];
          return mockStore[tableName]?.find(item => item.id === id) || null;
        }

        return mockStore[tableName]?.[0] || null;
      },
      run: async () => {
        // ── users ──
        if (lowerSql.includes("insert into users")) {
          const [id, uid, email, password, name, role, isVerified] = statement.args;
          mockStore.users.push({ id, uid, email, password, name, role, isVerified, createdAt: new Date().toISOString() });
        } else if (lowerSql.includes("update users")) {
          // Generic update users: last arg is always the WHERE id = ? value
          const id = statement.args[statement.args.length - 1];
          const user = mockStore.users.find(u => u.id === id);
          if (user) {
            // Parse SET clauses from the SQL to figure out which fields to update
            const setMatch = sql.match(/set\s+(.+?)\s+where/i);
            if (setMatch) {
              const fields = setMatch[1].split(",").map(f => f.trim().split(/\s*=\s*/)[0].trim());
              fields.forEach((field, idx) => {
                (user as any)[field] = statement.args[idx];
              });
            }
          }
        // ── courses ──
        } else if (lowerSql.includes("insert into courses")) {
          const [id, title, instructor, price, description, category, level, duration, image] = statement.args;
          mockStore.courses.push({ id, title, instructor, price, description, category, level, duration, image, createdAt: new Date().toISOString() });
        } else if (lowerSql.includes("update courses")) {
          const id = statement.args[statement.args.length - 1];
          const course = mockStore.courses.find(c => c.id === id);
          if (course) {
            const setMatch = sql.match(/set\s+(.+?)\s+where/i);
            if (setMatch) {
              const fields = setMatch[1].split(",").map(f => f.trim().split(/\s*=\s*/)[0].trim());
              fields.forEach((field, idx) => {
                (course as any)[field] = statement.args[idx];
              });
            }
          }
        } else if (lowerSql.includes("delete from courses")) {
          const id = statement.args[0];
          mockStore.courses = mockStore.courses.filter(c => c.id !== id);
        // ── submissions ──
        } else if (lowerSql.includes("insert into submissions")) {
          const [id, studentId, assignmentId, fileUrl, remark] = statement.args;
          mockStore.submissions.push({ id, studentId, assignmentId, fileUrl, remark: remark || "", submittedAt: new Date().toISOString(), grade: null, feedback: null, createdAt: new Date().toISOString() });
        } else if (lowerSql.includes("update submissions")) {
          const id = statement.args[statement.args.length - 1];
          const sub = mockStore.submissions.find(s => s.id === id);
          if (sub) {
            const setMatch = sql.match(/set\s+(.+?)\s+where/i);
            if (setMatch) {
              const fields = setMatch[1].split(",").map(f => f.trim().split(/\s*=\s*/)[0].trim());
              fields.forEach((field, idx) => {
                (sub as any)[field] = statement.args[idx];
              });
            }
          }
        // ── live_sessions ──
        } else if (lowerSql.includes("insert into live_sessions")) {
          const [id, title, date, time, instructor, status, type, replayUrl] = statement.args;
          mockStore.live_sessions.push({ id, title, date, time, instructor, status, type, replayUrl });
        } else if (lowerSql.includes("update live_sessions")) {
          const id = statement.args[statement.args.length - 1];
          const session = mockStore.live_sessions.find(s => s.id === id);
          if (session) {
            const setMatch = sql.match(/set\s+(.+?)\s+where/i);
            if (setMatch) {
              const fields = setMatch[1].split(",").map(f => f.trim().split(/\s*=\s*/)[0].trim());
              fields.forEach((field, idx) => {
                (session as any)[field] = statement.args[idx];
              });
            }
          }
        } else if (lowerSql.includes("delete from live_sessions")) {
          const id = statement.args[0];
          mockStore.live_sessions = mockStore.live_sessions.filter(s => s.id !== id);
        // ── assignments ──
        } else if (lowerSql.includes("insert into assignments")) {
          const [id, title, courseId, course, dueDate, status] = statement.args;
          mockStore.assignments.push({ id, title, courseId, course, dueDate, status: status || "not_submitted" });
        } else if (lowerSql.includes("update assignments")) {
          const id = statement.args[statement.args.length - 1];
          const assignment = mockStore.assignments.find(a => a.id === id);
          if (assignment) {
            const setMatch = sql.match(/set\s+(.+?)\s+where/i);
            if (setMatch) {
              const fields = setMatch[1].split(",").map(f => f.trim().split(/\s*=\s*/)[0].trim());
              fields.forEach((field, idx) => {
                (assignment as any)[field] = statement.args[idx];
              });
            }
          }
        } else if (lowerSql.includes("delete from assignments")) {
          const id = statement.args[0];
          mockStore.assignments = mockStore.assignments.filter(a => a.id !== id);
        // ── applications ──
        } else if (lowerSql.includes("update applications")) {
          const [status, id] = statement.args;
          const app = mockStore.applications.find(a => a.id === id);
          if (app) app.status = status;
        } else if (lowerSql.includes("delete from applications")) {
          const id = statement.args[0];
          mockStore.applications = mockStore.applications.filter(a => a.id !== id);
        // ── schedule ──
        } else if (lowerSql.includes("insert into schedule")) {
          const [id, title, time, instructor, type] = statement.args;
          mockStore.schedule.push({ id, title, time, instructor, type });
        } else if (lowerSql.includes("delete from schedule")) {
          const id = statement.args[0];
          mockStore.schedule = mockStore.schedule.filter(s => s.id !== id);
        // ── community_posts ──
        } else if (lowerSql.includes("insert into community_posts")) {
          const [id, authorId, authorName, avatar, title, content, category, tags] = statement.args;
          mockStore.community_posts.push({
            id, authorId, authorName, avatar, title, content, category,
            tags: JSON.parse(tags),
            likes: 0, comments: 0,
            createdAt: new Date().toISOString()
          });
        } else if (lowerSql.includes("update community_posts")) {
          if (lowerSql.includes("likes = likes + 1")) {
            const id = statement.args[0];
            const post = mockStore.community_posts.find(p => p.id === id);
            if (post) post.likes += 1;
          }
        }
        return { success: true };
      },
      all: async () => {
        let results = [...(mockStore[tableName] || [])];
        if (lowerSql.includes("order by createdat desc")) {
          results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        if (lowerSql.includes("order by duedate asc")) {
          results.sort((a, b) => {
            const da = a.dueDate || "";
            const db = b.dueDate || "";
            return da.localeCompare(db);
          });
        }
        if (lowerSql.includes("where s.studentid = ?")) {
          const studentId = statement.args[0];
          results = results.filter(s => s.studentId === studentId);
        }
        if (lowerSql.includes("where userid = ?")) {
          const userId = statement.args[0];
          results = results.filter(c => c.userId === userId);
        }
        return { results };
      },
    };
    return statement;
  }
};
