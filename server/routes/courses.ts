import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { Bindings, JWTPayload } from "../types";
import {
  generateId, normalizeMembershipTier, normalizeCourseRow,
  normalizeCourseWithAccess, buildResourcesFromCourses,
  resolveViewerFromDb,
} from "../lib/helpers";

const CourseSchema = z.object({
  title: z.string().min(1),
  instructor: z.string().min(1),
  price: z.number(),
  description: z.string().optional(),
  category: z.string().optional(),
  level: z.string().optional(),
  duration: z.string().optional(),
  image: z.string().optional(),
  videoUrl: z.string().optional(),
  pdfUrl: z.string().optional(),
  modules: z.union([z.string(), z.array(z.any())]).optional(),
});

export function registerCourseRoutes(
  app: Hono<{ Bindings: Bindings }>,
  authMiddleware: any,
  staffMiddleware: any,
) {
  // ── 课程列表 ──
  app.get("/courses", authMiddleware, async (c) => {
    const payload = c.get("jwtPayload") as JWTPayload;
    const viewer = (await resolveViewerFromDb(c, payload)) || payload;
    if (!c.env.DB) return c.json([]);

    try {
      const { results } = await c.env.DB.prepare("SELECT * FROM courses ORDER BY createdAt DESC").all();
      const normalizedCourses = (results || []).map(normalizeCourseRow);

      // Attach enrollment progress for the current viewer when available
      let progressByCourse = new Map<string, { progress: number; lastLessonId?: string }>();
      try {
        const enrollments = await c.env.DB.prepare(
          "SELECT courseId, progress, lastLessonId FROM enrollments WHERE userId = ?"
        ).bind(viewer.id).all();
        for (const row of enrollments.results || []) {
          progressByCourse.set((row as any).courseId, {
            progress: Number((row as any).progress || 0),
            lastLessonId: (row as any).lastLessonId || undefined,
          });
        }
      } catch {
        // enrollments table may not exist on older DBs
      }

      return c.json(
        normalizedCourses.map((course) => {
          const enrollment = progressByCourse.get(course.id);
          return normalizeCourseWithAccess(
            {
              ...course,
              progress: enrollment?.progress ?? course.progress ?? 0,
              lastLessonId: enrollment?.lastLessonId,
              isEnrolled: Boolean(enrollment),
            },
            viewer,
          );
        })
      );
    } catch (error: any) {
      return c.json({ success: false, error: error?.message || "获取课程列表失败" }, 500);
    }
  });

  // ── 课程详情 ──
  app.get("/courses/:id", authMiddleware, async (c) => {
    const payload = c.get("jwtPayload") as JWTPayload;
    const viewer = (await resolveViewerFromDb(c, payload)) || payload;
    const id = c.req.param("id");
    if (!c.env.DB) return c.json({ success: false, error: "当前环境未配置课程存储" }, 501);

    try {
      const course: any = await c.env.DB.prepare("SELECT * FROM courses WHERE id = ?").bind(id).first();
      if (!course) return c.json({ success: false, error: "课程不存在" }, 404);
      const normalizedCourse = normalizeCourseRow(course);

      let enrollment: any = null;
      try {
        enrollment = await c.env.DB.prepare(
          "SELECT progress, lastLessonId FROM enrollments WHERE userId = ? AND courseId = ?"
        ).bind(viewer.id, id).first();
      } catch {
        // ignore
      }

      return c.json(
        normalizeCourseWithAccess(
          {
            ...normalizedCourse,
            progress: enrollment ? Number(enrollment.progress || 0) : 0,
            lastLessonId: enrollment?.lastLessonId || undefined,
            isEnrolled: Boolean(enrollment),
          },
          viewer,
        )
      );
    } catch (error: any) {
      return c.json({ success: false, error: error?.message || "获取课程详情失败" }, 500);
    }
  });

  // ── 创建课程（管理员/老师） ──
  app.post("/courses", authMiddleware, staffMiddleware, zValidator("json", CourseSchema), async (c) => {
    const data = c.req.valid("json");
    const id = generateId("course");
    const serializedModules = typeof data.modules === "string" ? data.modules : JSON.stringify(data.modules || []);
    const normalizedLevel = normalizeMembershipTier(data.level);

    if (!c.env.DB) return c.json({ success: false, error: "当前环境未配置课程存储" }, 501);

    try {
      await c.env.DB.prepare(
        "INSERT INTO courses (id, title, instructor, price, description, category, level, duration, image, videoUrl, pdfUrl, modules) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(
        id, data.title, data.instructor, data.price,
        data.description || null, data.category || null, normalizedLevel,
        data.duration || null, data.image || null, data.videoUrl || null,
        data.pdfUrl || null, serializedModules,
      ).run();

      const newCourse = await c.env.DB.prepare("SELECT * FROM courses WHERE id = ?").bind(id).first();
      return c.json(normalizeCourseRow(newCourse), 201);
    } catch (error: any) {
      return c.json({ success: false, error: error?.message || "创建课程失败" }, 500);
    }
  });

  // ── 更新课程（管理员/老师） ──
  app.put("/courses/:id", authMiddleware, staffMiddleware, zValidator("json", CourseSchema), async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const serializedModules = typeof data.modules === "string" ? data.modules : JSON.stringify(data.modules || []);
    const normalizedLevel = normalizeMembershipTier(data.level);

    if (!c.env.DB) return c.json({ success: false, error: "当前环境未配置课程存储" }, 501);

    try {
      await c.env.DB.prepare(
        "UPDATE courses SET title = ?, instructor = ?, price = ?, description = ?, category = ?, level = ?, duration = ?, image = ?, videoUrl = ?, pdfUrl = ?, modules = ? WHERE id = ?"
      ).bind(
        data.title, data.instructor, data.price,
        data.description || null, data.category || null, normalizedLevel,
        data.duration || null, data.image || null, data.videoUrl || null,
        data.pdfUrl || null, serializedModules, id,
      ).run();

      const updated = await c.env.DB.prepare("SELECT * FROM courses WHERE id = ?").bind(id).first();
      return c.json(normalizeCourseRow(updated));
    } catch (error: any) {
      return c.json({ success: false, error: error?.message || "更新课程失败" }, 500);
    }
  });

  // ── 删除课程（管理员/老师） ──
  // Remote D1 may lack ON DELETE CASCADE; remove dependents first.
  app.delete("/courses/:id", authMiddleware, staffMiddleware, async (c) => {
    const id = c.req.param("id");
    if (!c.env.DB) return c.json({ success: false, error: "当前环境未配置课程存储" }, 501);

    try {
      const existing = await c.env.DB.prepare("SELECT id FROM courses WHERE id = ?").bind(id).first();
      if (!existing) return c.json({ success: false, error: "课程不存在" }, 404);

      // submissions -> assignments -> enrollments -> course
      await c.env.DB.prepare(
        `DELETE FROM submissions
         WHERE assignmentId IN (SELECT id FROM assignments WHERE courseId = ?)`
      ).bind(id).run();

      await c.env.DB.prepare("DELETE FROM assignments WHERE courseId = ?").bind(id).run();

      try {
        await c.env.DB.prepare("DELETE FROM enrollments WHERE courseId = ?").bind(id).run();
      } catch {
        // enrollments table may not exist on very old DBs
      }

      await c.env.DB.prepare("DELETE FROM courses WHERE id = ?").bind(id).run();
      return c.body(null, 204);
    } catch (error: any) {
      return c.json({ success: false, error: error?.message || "删除课程失败" }, 500);
    }
  });

  // ── 学习资源（从课程自动衍生） ──
  app.get("/resources", authMiddleware, async (c) => {
    const payload = c.get("jwtPayload") as JWTPayload;
    const viewer = (await resolveViewerFromDb(c, payload)) || payload;
    if (!c.env.DB) return c.json([]);

    try {
      const { results } = await c.env.DB.prepare("SELECT * FROM courses ORDER BY createdAt DESC").all();
      const normalizedCourses = (results || []).map(normalizeCourseRow);
      const coursesWithAccess = normalizedCourses.map((course) => normalizeCourseWithAccess(course, viewer));
      return c.json(buildResourcesFromCourses(coursesWithAccess));
    } catch (error: any) {
      return c.json({ success: false, error: error?.message || "获取学习资料失败" }, 500);
    }
  });
}
