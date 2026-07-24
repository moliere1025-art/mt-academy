import { Hono } from "hono";
import { Bindings, JWTPayload } from "../types";
import {
  generateId, safePrepareFirst, safePrepareAll, ensurePreviewUserExists,
  resolveViewerFromDb, hasCourseAccess, normalizeCourseRow,
} from "../lib/helpers";

export function registerEnrollmentRoutes(
  app: Hono<{ Bindings: Bindings }>,
  authMiddleware: any,
) {
  // ── 获取当前用户的选课列表 ──
  app.get("/enrollments", authMiddleware, async (c) => {
    const payload = c.get("jwtPayload") as JWTPayload;
    const user = (await resolveViewerFromDb(c, payload)) || payload;
    if (!c.env.DB) return c.json([]);

    try {
      const result = await safePrepareAll(
        c.env.DB,
        `SELECT e.id, e.userId, e.courseId, e.progress, e.lastLessonId,
                e.enrolledAt, e.completedAt,
                c.title AS courseTitle, c.image AS courseImage,
                c.instructor, c.level, c.duration, c.modules
         FROM enrollments e
         LEFT JOIN courses c ON c.id = e.courseId
         WHERE e.userId = ?
         ORDER BY e.enrolledAt DESC`,
        [user.id]
      );
      const rows = (result.results || []).map((row: any) => {
        const course = normalizeCourseRow({
          id: row.courseId,
          title: row.courseTitle,
          image: row.courseImage,
          instructor: row.instructor,
          level: row.level,
          duration: row.duration,
          modules: row.modules,
        });
        return {
          id: row.id,
          userId: row.userId,
          courseId: row.courseId,
          progress: Number(row.progress || 0),
          lastLessonId: row.lastLessonId,
          enrolledAt: row.enrolledAt,
          completedAt: row.completedAt,
          courseTitle: row.courseTitle,
          courseImage: row.courseImage,
          instructor: row.instructor,
          level: course.level,
          duration: row.duration,
          hasVideo: course.hasVideo,
        };
      });
      return c.json(rows);
    } catch (error: any) {
      return c.json({ success: false, error: error?.message || "获取选课列表失败" }, 500);
    }
  });

  // ── 选课（学生注册课程） ──
  app.post("/enrollments/:courseId", authMiddleware, async (c) => {
    const payload = c.get("jwtPayload") as JWTPayload;
    const user = (await resolveViewerFromDb(c, payload)) || payload;
    const courseId = c.req.param("courseId");
    const db = c.env.DB;

    if (!db) return c.json({ success: false, error: "当前环境不支持选课" }, 501);

    try {
      await ensurePreviewUserExists(db, user, c.env);

      const course = await safePrepareFirst(db, "SELECT id, title, level FROM courses WHERE id = ?", [courseId]);
      if (!course) return c.json({ success: false, error: "课程不存在" }, 404);

      if (!hasCourseAccess(user, (course as any).level)) {
        return c.json({ success: false, error: "当前会员等级无权选该课程" }, 403);
      }

      const existing = await safePrepareFirst(
        db,
        "SELECT id FROM enrollments WHERE userId = ? AND courseId = ?",
        [user.id, courseId]
      );
      if (existing) return c.json({ success: false, error: "你已经选过这门课程了" }, 409);

      const id = generateId("enroll");
      await db.prepare(
        "INSERT INTO enrollments (id, userId, courseId, progress, enrolledAt) VALUES (?, ?, ?, 0, datetime('now'))"
      ).bind(id, user.id, courseId).run();

      await db.prepare(
        "UPDATE courses SET students = students + 1 WHERE id = ?"
      ).bind(courseId).run();

      const enrollment = await safePrepareFirst(db, "SELECT * FROM enrollments WHERE id = ?", [id]);
      return c.json(enrollment, 201);
    } catch (error: any) {
      return c.json({ success: false, error: error?.message || "选课失败" }, 500);
    }
  });

  // ── 更新学习进度 ──
  app.put("/enrollments/:courseId/progress", authMiddleware, async (c) => {
    const payload = c.get("jwtPayload") as JWTPayload;
    const user = (await resolveViewerFromDb(c, payload)) || payload;
    const courseId = c.req.param("courseId");
    const db = c.env.DB;

    if (!db) return c.json({ success: false, error: "当前环境不支持进度更新" }, 501);

    try {
      const body = await c.req.json<{ progress?: number; lastLessonId?: string }>();
      const progress = Math.max(0, Math.min(100, Number(body.progress || 0)));
      const lastLessonId = body.lastLessonId || null;

      let existing = await safePrepareFirst(
        db,
        "SELECT id FROM enrollments WHERE userId = ? AND courseId = ?",
        [user.id, courseId]
      );

      // Auto-enroll on first progress update if the user has access
      if (!existing) {
        const course = await safePrepareFirst(db, "SELECT id, level FROM courses WHERE id = ?", [courseId]);
        if (!course) return c.json({ success: false, error: "课程不存在" }, 404);
        if (!hasCourseAccess(user, (course as any).level)) {
          return c.json({ success: false, error: "当前会员等级无权学习该课程" }, 403);
        }
        await ensurePreviewUserExists(db, user, c.env);
        const id = generateId("enroll");
        await db.prepare(
          "INSERT INTO enrollments (id, userId, courseId, progress, lastLessonId, enrolledAt) VALUES (?, ?, ?, ?, ?, datetime('now'))"
        ).bind(id, user.id, courseId, progress, lastLessonId).run();
        await db.prepare("UPDATE courses SET students = students + 1 WHERE id = ?").bind(courseId).run();
        existing = { id };
      }

      if (progress >= 100) {
        await db.prepare(
          `UPDATE enrollments SET progress = ?, lastLessonId = ?, completedAt = datetime('now') WHERE userId = ? AND courseId = ?`
        ).bind(progress, lastLessonId, user.id, courseId).run();
      } else {
        await db.prepare(
          `UPDATE enrollments SET progress = ?, lastLessonId = ?, completedAt = NULL WHERE userId = ? AND courseId = ?`
        ).bind(progress, lastLessonId, user.id, courseId).run();
      }

      const updated = await safePrepareFirst(
        db,
        "SELECT * FROM enrollments WHERE userId = ? AND courseId = ?",
        [user.id, courseId]
      );
      return c.json(updated);
    } catch (error: any) {
      return c.json({ success: false, error: error?.message || "更新进度失败" }, 500);
    }
  });

  // ── Dashboard 统计 API（学生） ──
  app.get("/dashboard/stats", authMiddleware, async (c) => {
    const payload = c.get("jwtPayload") as JWTPayload;
    const user = (await resolveViewerFromDb(c, payload)) || payload;
    const db = c.env.DB;

    if (!db) {
      return c.json({
        enrolledCourses: 0,
        completedCourses: 0,
        pendingAssignments: 0,
        upcomingLive: 0,
        averageProgress: 0,
      });
    }

    try {
      const enrolledResult = await safePrepareFirst(
        db,
        "SELECT COUNT(*) as count FROM enrollments WHERE userId = ?",
        [user.id]
      );
      const completedResult = await safePrepareFirst(
        db,
        "SELECT COUNT(*) as count FROM enrollments WHERE userId = ? AND completedAt IS NOT NULL",
        [user.id]
      );
      const progressResult = await safePrepareFirst(
        db,
        "SELECT AVG(progress) as avg FROM enrollments WHERE userId = ?",
        [user.id]
      );
      const pendingResult = await safePrepareFirst(
        db,
        `SELECT COUNT(*) as count FROM assignments a
         WHERE a.courseId IN (SELECT courseId FROM enrollments WHERE userId = ?)
         AND a.id NOT IN (SELECT assignmentId FROM submissions WHERE studentId = ?)`,
        [user.id, user.id]
      );
      const liveResult = await safePrepareFirst(
        db,
        "SELECT COUNT(*) as count FROM live_sessions WHERE status = 'upcoming'",
        []
      );

      return c.json({
        enrolledCourses: (enrolledResult as any)?.count || 0,
        completedCourses: (completedResult as any)?.count || 0,
        pendingAssignments: (pendingResult as any)?.count || 0,
        upcomingLive: (liveResult as any)?.count || 0,
        averageProgress: Math.round((progressResult as any)?.avg || 0),
      });
    } catch (error: any) {
      return c.json({ success: false, error: error?.message || "获取统计数据失败" }, 500);
    }
  });
}
