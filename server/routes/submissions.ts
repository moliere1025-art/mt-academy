import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { Bindings, JWTPayload } from "../types";
import { mockStore } from "../db";
import {
  generateId, normalizeSubmissionRow, normalizeAssignmentRow,
  readSubmissionsWithFallback, readSubmissionByIdWithFallback,
  insertSubmissionWithFallback, ensurePreviewUserExists,
  hasCourseAccess, resolveViewerFromDb, isStaffRole,
} from "../lib/helpers";

const GradeSchema = z.object({
  grade: z.string().optional(),
  feedback: z.string().optional(),
});

const CreateAssignmentSchema = z.object({
  title: z.string().min(1),
  courseId: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().optional(),
});

const UpdateAssignmentSchema = z.object({
  title: z.string().min(1).optional(),
  courseId: z.string().optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
});

export function registerSubmissionRoutes(
  app: Hono<{ Bindings: Bindings }>,
  authMiddleware: any,
  staffMiddleware: any,
) {
  // ── 提交记录列表 ──
  app.get("/submissions", authMiddleware, async (c) => {
    try {
      const payload = c.get("jwtPayload") as JWTPayload;
      const viewer = (await resolveViewerFromDb(c, payload)) || payload;
      const db = c.env.DB;
      if (!db) return c.json([]);

      const results = await readSubmissionsWithFallback(db, viewer);
      return c.json((results || []).map(normalizeSubmissionRow));
    } catch (error: any) {
      return c.json({ success: false, error: error?.message || "获取提交记录失败" }, 500);
    }
  });

  // ── 提交作业 ──
  app.post("/submissions", authMiddleware, async (c) => {
    try {
      const payload = c.get("jwtPayload") as JWTPayload;
      const viewer = (await resolveViewerFromDb(c, payload)) || payload;
      const db = c.env.DB;
      const body = await c.req.parseBody();
      const assignmentId = typeof body.assignmentId === "string" ? body.assignmentId : "";
      const fileUrl = typeof body.fileUrl === "string" ? body.fileUrl : "";
      const remark = typeof body.remark === "string" ? body.remark.trim() : "";

      if (!assignmentId) return c.json({ success: false, error: "缺少作业 ID" }, 400);
      if (!fileUrl) return c.json({ success: false, error: "缺少作业文件地址" }, 400);
      if (!db) return c.json({ success: false, error: "当前环境未配置作业存储" }, 501);

      const assignment = await db.prepare(
        `SELECT assignments.id, courses.level AS courseLevel
         FROM assignments
         LEFT JOIN courses ON courses.id = assignments.courseId
         WHERE assignments.id = ?`
      ).bind(assignmentId).first() as any;
      if (!assignment) return c.json({ success: false, error: "作业不存在" }, 404);
      if (!hasCourseAccess(viewer, assignment.courseLevel)) {
        return c.json({ success: false, error: "无权提交该作业" }, 403);
      }

      const existing = await db.prepare(
        "SELECT id FROM submissions WHERE studentId = ? AND assignmentId = ?"
      ).bind(viewer.id, assignmentId).first();
      if (existing) {
        return c.json({ success: false, error: "你已提交过该作业，请勿重复提交" }, 409);
      }

      await ensurePreviewUserExists(db, viewer, c.env);

      const id = generateId("sub");

      await insertSubmissionWithFallback(db, {
        id,
        userId: viewer.id,
        assignmentId,
        fileUrl,
        remark,
      });

      const submission = await readSubmissionByIdWithFallback(db, id);
      return c.json(normalizeSubmissionRow(submission), 201);
    } catch (error: any) {
      const message = String(error?.message || "");
      if (message.includes("UNIQUE") || message.includes("unique")) {
        return c.json({ success: false, error: "你已提交过该作业，请勿重复提交" }, 409);
      }
      return c.json({ success: false, error: error?.message || "提交作业失败" }, 500);
    }
  });

  // ── 批改作业（管理员/老师） ──
  app.post("/submissions/:id/grade", authMiddleware, staffMiddleware, zValidator("json", GradeSchema), async (c) => {
    try {
      const id = c.req.param("id");
      const body = c.req.valid("json");
      const db = c.env.DB;

      if (!db) {
        const sub = mockStore.submissions.find((s: any) => s.id === id);
        if (!sub) return c.json({ success: false, error: "提交记录不存在" }, 404);
        if (body.grade !== undefined) sub.grade = body.grade;
        if (body.feedback !== undefined) sub.feedback = body.feedback;
        sub.gradedAt = new Date().toISOString();
        return c.json(normalizeSubmissionRow(sub));
      }

      await db.prepare(
        "UPDATE submissions SET grade = ?, feedback = ?, gradedAt = datetime('now') WHERE id = ?"
      ).bind(body.grade || null, body.feedback || null, id).run();

      const updated = await readSubmissionByIdWithFallback(db, id);
      return c.json(normalizeSubmissionRow(updated));
    } catch (error: any) {
      return c.json({ success: false, error: error?.message || "提交批改结果失败" }, 500);
    }
  });

  // ── 作业列表（唯一注册点；JOIN 课程标题 + 会员门槛） ──
  app.get("/assignments", authMiddleware, async (c) => {
    try {
      const payload = c.get("jwtPayload") as JWTPayload;
      const viewer = (await resolveViewerFromDb(c, payload)) || payload;
      const db = c.env.DB;
      if (!db) return c.json(mockStore.assignments.map(normalizeAssignmentRow));

      const { results } = await db.prepare(`
        SELECT assignments.id, assignments.title, assignments.courseId,
          assignments.description, assignments.dueDate, assignments.createdAt,
          courses.title AS course, courses.level AS courseLevel
        FROM assignments
        LEFT JOIN courses ON courses.id = assignments.courseId
        ORDER BY assignments.dueDate ASC
      `).all();

      const filtered = (results || []).filter((row: any) => {
        if (isStaffRole(viewer.role)) return true;
        return hasCourseAccess(viewer, row.courseLevel);
      });

      return c.json(filtered.map(({ courseLevel, ...row }: any) => normalizeAssignmentRow(row)));
    } catch (error: any) {
      return c.json({ success: false, error: error?.message || "获取作业列表失败" }, 500);
    }
  });

  // ── 创建作业（管理员/老师） ──
  app.post("/assignments", authMiddleware, staffMiddleware, zValidator("json", CreateAssignmentSchema), async (c) => {
    try {
      const body = c.req.valid("json");
      const id = generateId("assign");
      const db = c.env.DB;

      if (!db) {
        const newAssignment = {
          id,
          title: body.title,
          courseId: body.courseId,
          description: body.description || "",
          dueDate: body.dueDate || "",
          createdAt: new Date().toISOString(),
        };
        mockStore.assignments.push(newAssignment);
        return c.json(normalizeAssignmentRow(newAssignment), 201);
      }

      const course = await db.prepare("SELECT id, title FROM courses WHERE id = ?").bind(body.courseId).first() as any;
      if (!course) return c.json({ success: false, error: "关联课程不存在" }, 404);

      await db.prepare(
        "INSERT INTO assignments (id, title, courseId, description, dueDate, createdAt) VALUES (?, ?, ?, ?, ?, datetime('now'))"
      ).bind(id, body.title, body.courseId, body.description || null, body.dueDate || null).run();

      const created = await db.prepare(`
        SELECT assignments.id, assignments.title, assignments.courseId,
          assignments.description, assignments.dueDate, assignments.createdAt,
          courses.title AS course
        FROM assignments
        LEFT JOIN courses ON courses.id = assignments.courseId
        WHERE assignments.id = ?
      `).bind(id).first();

      return c.json(normalizeAssignmentRow(created || { id, ...body, course: course.title }), 201);
    } catch (error: any) {
      return c.json({ success: false, error: error?.message || "创建作业失败" }, 500);
    }
  });

  // ── 更新作业（管理员/老师） ──
  app.put("/assignments/:id", authMiddleware, staffMiddleware, zValidator("json", UpdateAssignmentSchema), async (c) => {
    try {
      const id = c.req.param("id");
      const body = c.req.valid("json");
      const db = c.env.DB;

      if (!db) {
        const assignment = mockStore.assignments.find((a: any) => a.id === id);
        if (!assignment) return c.json({ success: false, error: "作业不存在" }, 404);
        if (body.title !== undefined) assignment.title = body.title;
        if (body.courseId !== undefined) assignment.courseId = body.courseId;
        if (body.description !== undefined) assignment.description = body.description;
        if (body.dueDate !== undefined) assignment.dueDate = body.dueDate;
        return c.json(normalizeAssignmentRow(assignment));
      }

      if (body.courseId) {
        const course = await db.prepare("SELECT id FROM courses WHERE id = ?").bind(body.courseId).first();
        if (!course) return c.json({ success: false, error: "关联课程不存在" }, 404);
      }

      const setClauses: string[] = [];
      const values: any[] = [];
      if (body.title !== undefined) { setClauses.push("title = ?"); values.push(body.title); }
      if (body.courseId !== undefined) { setClauses.push("courseId = ?"); values.push(body.courseId); }
      if (body.description !== undefined) { setClauses.push("description = ?"); values.push(body.description); }
      if (body.dueDate !== undefined) { setClauses.push("dueDate = ?"); values.push(body.dueDate); }

      if (setClauses.length === 0) return c.json({ success: false, error: "未提供任何更新字段" }, 400);

      values.push(id);
      await db.prepare(`UPDATE assignments SET ${setClauses.join(", ")} WHERE id = ?`).bind(...values).run();

      const updated = await db.prepare(`
        SELECT assignments.id, assignments.title, assignments.courseId,
          assignments.description, assignments.dueDate, assignments.createdAt,
          courses.title AS course
        FROM assignments
        LEFT JOIN courses ON courses.id = assignments.courseId
        WHERE assignments.id = ?
      `).bind(id).first();

      if (!updated) return c.json({ success: false, error: "作业不存在" }, 404);
      return c.json(normalizeAssignmentRow(updated));
    } catch (error: any) {
      return c.json({ success: false, error: error?.message || "更新作业失败" }, 500);
    }
  });

  // ── 删除作业（管理员/老师） ──
  app.delete("/assignments/:id", authMiddleware, staffMiddleware, async (c) => {
    try {
      const id = c.req.param("id");
      const db = c.env.DB;

      if (!db) {
        const idx = mockStore.assignments.findIndex((a: any) => a.id === id);
        if (idx === -1) return c.json({ success: false, error: "作业不存在" }, 404);
        mockStore.assignments.splice(idx, 1);
        return c.body(null, 204);
      }

      await db.prepare("DELETE FROM assignments WHERE id = ?").bind(id).run();
      return c.body(null, 204);
    } catch (error: any) {
      return c.json({ success: false, error: error?.message || "删除作业失败" }, 500);
    }
  });
}
