import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { Bindings } from "../types";
import { generateId } from "../lib/helpers";
import { mockStore } from "../db";

const LiveSessionSchema = z.object({
  title: z.string().min(1),
  date: z.string().optional(),
  time: z.string().optional(),
  instructor: z.string().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  replayUrl: z.string().optional(),
});

const UpdateLiveSessionSchema = z.object({
  title: z.string().min(1).optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  instructor: z.string().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  replayUrl: z.string().optional(),
});

export function registerLiveRoutes(
  app: Hono<{ Bindings: Bindings }>,
  authMiddleware: any,
  staffMiddleware: any,
) {
  // ── 直播列表 ──
  app.get("/live/sessions", authMiddleware, async (c) => {
    if (!c.env.DB) return c.json(mockStore.live_sessions);

    try {
      const { results } = await c.env.DB.prepare("SELECT * FROM live_sessions ORDER BY date ASC, time ASC").all();
      return c.json(results || []);
    } catch (error: any) {
      return c.json({ success: false, error: error?.message || "获取直播列表失败" }, 500);
    }
  });

  // ── 创建直播（管理员/老师） ──
  app.post("/live/sessions", authMiddleware, staffMiddleware, zValidator("json", LiveSessionSchema), async (c) => {
    const body = c.req.valid("json");
    const id = generateId("live");

    if (!c.env.DB) {
      const newSession = {
        id, title: body.title, date: body.date || null, time: body.time || null,
        instructor: body.instructor || null, status: body.status || null,
        type: body.type || null, replayUrl: body.replayUrl || null,
      };
      mockStore.live_sessions.push(newSession);
      return c.json(newSession, 201);
    }

    try {
      await c.env.DB.prepare(
        "INSERT INTO live_sessions (id, title, date, time, instructor, status, type, replayUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(
        id, body.title, body.date || null, body.time || null,
        body.instructor || null, body.status || null, body.type || null, body.replayUrl || null,
      ).run();

      const newSession = await c.env.DB.prepare("SELECT * FROM live_sessions WHERE id = ?").bind(id).first();
      return c.json(newSession, 201);
    } catch (error: any) {
      return c.json({ success: false, error: error?.message || "创建直播失败" }, 500);
    }
  });

  // ── 更新直播（管理员/老师） ──
  app.put("/live/sessions/:id", authMiddleware, staffMiddleware, zValidator("json", UpdateLiveSessionSchema), async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const db = c.env.DB;

    try {
      if (!db) {
        const session = mockStore.live_sessions.find((s: any) => s.id === id);
        if (!session) return c.json({ success: false, error: "直播不存在" }, 404);
        if (body.title !== undefined) session.title = body.title;
        if (body.date !== undefined) session.date = body.date;
        if (body.time !== undefined) session.time = body.time;
        if (body.instructor !== undefined) session.instructor = body.instructor;
        if (body.status !== undefined) session.status = body.status;
        if (body.type !== undefined) session.type = body.type;
        if (body.replayUrl !== undefined) session.replayUrl = body.replayUrl;
        return c.json(session);
      }

      const setClauses: string[] = [];
      const values: any[] = [];
      if (body.title !== undefined) { setClauses.push("title = ?"); values.push(body.title); }
      if (body.date !== undefined) { setClauses.push("date = ?"); values.push(body.date); }
      if (body.time !== undefined) { setClauses.push("time = ?"); values.push(body.time); }
      if (body.instructor !== undefined) { setClauses.push("instructor = ?"); values.push(body.instructor); }
      if (body.status !== undefined) { setClauses.push("status = ?"); values.push(body.status); }
      if (body.type !== undefined) { setClauses.push("type = ?"); values.push(body.type); }
      if (body.replayUrl !== undefined) { setClauses.push("replayUrl = ?"); values.push(body.replayUrl); }

      if (setClauses.length === 0) return c.json({ success: false, error: "未提供任何更新字段" }, 400);

      values.push(id);
      await db.prepare(`UPDATE live_sessions SET ${setClauses.join(", ")} WHERE id = ?`).bind(...values).run();

      const updated = await db.prepare("SELECT * FROM live_sessions WHERE id = ?").bind(id).first();
      if (!updated) return c.json({ success: false, error: "直播不存在" }, 404);
      return c.json(updated);
    } catch (error: any) {
      return c.json({ success: false, error: error?.message || "更新直播失败" }, 500);
    }
  });

  // ── 删除直播（管理员/老师） ──
  app.delete("/live/sessions/:id", authMiddleware, staffMiddleware, async (c) => {
    const id = c.req.param("id");
    const db = c.env.DB;

    try {
      if (!db) {
        const idx = mockStore.live_sessions.findIndex((s: any) => s.id === id);
        if (idx === -1) return c.json({ success: false, error: "直播不存在" }, 404);
        mockStore.live_sessions.splice(idx, 1);
        return c.body(null, 204);
      }

      await db.prepare("DELETE FROM live_sessions WHERE id = ?").bind(id).run();
      return c.body(null, 204);
    } catch (error: any) {
      return c.json({ success: false, error: error?.message || "删除直播失败" }, 500);
    }
  });
}
