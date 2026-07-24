import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { sign } from "hono/jwt";
import { Bindings, JWTPayload } from "../types";
import { mockStore } from "../db";
import {
  bcrypt, getJwtSecret, generateId, normalizeUserRow,
  findUserByEmail, findUserById, createUser, isFallbackUser,
  readUsersWithFallback,
} from "../lib/helpers";

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const ProfileSchema = z.object({
  name: z.string().min(2),
  avatar: z.string().optional(),
  learningGoal: z.string().trim().min(2).max(200).optional(),
});

const UpdatePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "新密码不能与当前密码相同",
  path: ["newPassword"],
});

const ALLOWED_ROLES = new Set(["admin", "teacher", "student"]);
const ALLOWED_MEMBERSHIP = new Set(["Core", "Advanced", "Mastery", "Elite"]);

export function registerAuthRoutes(
  app: Hono<{ Bindings: Bindings }>,
  authMiddleware: any,
  adminMiddleware: any,
) {
  // ── 注册 ──
  app.post("/auth/register", zValidator("json", RegisterSchema), async (c) => {
    try {
      const { email, password, name } = c.req.valid("json");
      const existingUser = await findUserByEmail(c, email);
      if (existingUser) {
        return c.json({ success: false, error: "该邮箱已被注册" }, 400);
      }

      const id = generateId("user");
      const createdUser = await createUser(c, { id, email, name, password });

      const safeUser = normalizeUserRow({
        id: createdUser?.id || id,
        uid: createdUser?.uid || id,
        email,
        name,
        role: "student",
        membershipLevel: "Core",
        isVerified: false,
        createdAt: createdUser?.createdAt || new Date().toISOString(),
      });

      const token = await sign(
        {
          id: safeUser.id,
          email: safeUser.email,
          name: safeUser.name,
          role: safeUser.role,
          membershipLevel: safeUser.membershipLevel || "Core",
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
        },
        getJwtSecret(c),
        "HS256"
      );

      return c.json({
        success: true,
        data: { token, user: safeUser },
      }, 201);
    } catch (error: any) {
      console.error("[auth/register] failed", error);
      return c.json({ success: false, error: "注册失败", debug: error?.message || String(error) }, 500);
    }
  });

  // ── 登录 ──
  app.post("/auth/login", zValidator("json", LoginSchema), async (c) => {
    try {
      const { email, password } = c.req.valid("json");
      const user: any = await findUserByEmail(c, email);
      if (!user) {
        return c.json({ success: false, error: "邮箱或密码错误" }, 401);
      }

      const passwordIsValid = isFallbackUser(user)
        ? password === user.password
        : await bcrypt.compare(password, user.password);

      if (!passwordIsValid) {
        return c.json({ success: false, error: "邮箱或密码错误" }, 401);
      }

      const safeUser = normalizeUserRow(user);
      const token = await sign(
        {
          id: safeUser.id,
          email: safeUser.email,
          name: safeUser.name,
          role: safeUser.role,
          membershipLevel: safeUser.membershipLevel || "Core",
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
        },
        getJwtSecret(c),
        "HS256"
      );

      return c.json({ success: true, data: { token, user: safeUser } });
    } catch (error: any) {
      console.error("[auth/login] failed", error);
      return c.json({ success: false, error: "登录失败", debug: error?.message || String(error) }, 500);
    }
  });

  // ── 当前用户 ──
  app.get("/auth/me", authMiddleware, async (c) => {
    try {
      const payload = c.get("jwtPayload") as JWTPayload;
      const user = await findUserById(c, payload.id);
      if (!user) {
        return c.json({ success: false, error: "用户不存在" }, 404);
      }
      return c.json({ success: true, data: normalizeUserRow(user) });
    } catch (error: any) {
      return c.json({ success: false, error: error?.message || "获取当前用户失败" }, 500);
    }
  });

  // ── 更新资料 ──
  app.put("/auth/profile", authMiddleware, zValidator("json", ProfileSchema), async (c) => {
    const payload = c.get("jwtPayload") as JWTPayload;
    const body = c.req.valid("json");
    const trimmedLearningGoal = body.learningGoal?.trim();
    const db = c.env.DB;

    if (!db) {
      const userInStore = mockStore.users.find((u: any) => u.id === payload.id);
      if (!userInStore) return c.json({ success: false, error: "用户不存在" }, 404);
      userInStore.name = body.name.trim();
      if (body.avatar) userInStore.avatar = body.avatar;
      if (trimmedLearningGoal) userInStore.learningGoal = trimmedLearningGoal;
      return c.json({
        success: true,
        data: normalizeUserRow(userInStore),
      });
    }

    try {
      await db.prepare(
        "UPDATE users SET name = ?, avatar = ?, learningGoal = ? WHERE id = ?"
      ).bind(body.name.trim(), body.avatar || null, trimmedLearningGoal || null, payload.id).run();
    } catch (error: any) {
      if (!String(error?.message || "").includes("no such column")) throw error;
      await db.prepare("UPDATE users SET name = ? WHERE id = ?").bind(body.name.trim(), payload.id).run();
    }

    const updatedUser = await findUserById(c, payload.id);
    if (!updatedUser) return c.json({ success: false, error: "用户不存在" }, 404);
    return c.json({ success: true, data: normalizeUserRow(updatedUser) });
  });

  // ── 修改密码 ──
  app.put("/auth/password", authMiddleware, zValidator("json", UpdatePasswordSchema), async (c) => {
    const payload = c.get("jwtPayload") as JWTPayload;
    const { currentPassword, newPassword } = c.req.valid("json");

    if (!c.env.DB) {
      const userInStore = mockStore.users.find((u: any) => u.id === payload.id);
      if (!userInStore) return c.json({ success: false, error: "用户不存在" }, 404);

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userInStore.password);
      if (!isCurrentPasswordValid) return c.json({ success: false, error: "当前密码错误" }, 400);

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      userInStore.password = hashedNewPassword;
      return c.json({ success: true, message: "密码更新成功" });
    }

    const user: any = await c.env.DB.prepare(
      "SELECT id, password FROM users WHERE id = ?"
    ).bind(payload.id).first();

    if (!user) return c.json({ success: false, error: "用户不存在" }, 404);

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) return c.json({ success: false, error: "当前密码错误" }, 400);

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await c.env.DB.prepare("UPDATE users SET password = ? WHERE id = ?").bind(hashedNewPassword, payload.id).run();

    return c.json({ success: true, message: "密码更新成功" });
  });

  // ── 学生认证：仅管理员可审核通过（取消一键自助认证） ──
  app.post("/auth/verify-student", authMiddleware, adminMiddleware, async (c) => {
    const body = await c.req.json().catch(() => ({} as any));
    const targetId = body?.userId || body?.id;
    if (!targetId) {
      return c.json({ success: false, error: "缺少要认证的学生 ID" }, 400);
    }
    if (!c.env.DB) return c.json({ success: false, error: "当前环境不支持学生认证" }, 501);

    const target = await c.env.DB.prepare("SELECT id, role FROM users WHERE id = ?").bind(targetId).first() as any;
    if (!target) return c.json({ success: false, error: "用户不存在" }, 404);
    if (target.role !== "student") {
      return c.json({ success: false, error: "只能认证学生账号" }, 400);
    }

    await c.env.DB.prepare("UPDATE users SET isVerified = 1 WHERE id = ?").bind(targetId).run();
    return c.json({ success: true, message: "学生认证已通过" });
  });

  // ── 用户列表（管理员） ──
  app.get("/users", authMiddleware, adminMiddleware, async (c) => {
    const db = c.env.DB;
    if (!db) {
      return c.json(mockStore.users.map((u: any) => normalizeUserRow(u)));
    }
    try {
      const results = await readUsersWithFallback(db);
      return c.json(results.map(normalizeUserRow));
    } catch (error: any) {
      return c.json({ success: false, error: error?.message || "获取用户列表失败" }, 500);
    }
  });

  // ── 更新用户（管理员） ──
  const UpdateUserSchema = z.object({
    membershipLevel: z.string().optional(),
    role: z.string().optional(),
    isVerified: z.boolean().optional(),
    name: z.string().min(2).optional(),
  });

  app.put("/auth/users/:id", authMiddleware, adminMiddleware, zValidator("json", UpdateUserSchema), async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const db = c.env.DB;
    const actor = c.get("jwtPayload") as JWTPayload;

    try {
      if (body.role !== undefined && !ALLOWED_ROLES.has(body.role)) {
        return c.json({ success: false, error: "无效的角色" }, 400);
      }
      if (body.membershipLevel !== undefined && !ALLOWED_MEMBERSHIP.has(body.membershipLevel)) {
        return c.json({ success: false, error: "无效的会员等级" }, 400);
      }

      // Prevent demoting the last admin
      if (body.role && body.role !== "admin" && db) {
        const target = await db.prepare("SELECT role FROM users WHERE id = ?").bind(id).first() as any;
        if (target?.role === "admin") {
          const adminCount = await db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").first("count") as number;
          if (Number(adminCount) <= 1) {
            return c.json({ success: false, error: "不能取消最后一个管理员的角色" }, 400);
          }
        }
      }

      if (!db) {
        const userInStore = mockStore.users.find((u: any) => u.id === id);
        if (!userInStore) return c.json({ success: false, error: "用户不存在" }, 404);
        if (body.membershipLevel !== undefined) userInStore.membershipLevel = body.membershipLevel;
        if (body.role !== undefined) userInStore.role = body.role;
        if (body.isVerified !== undefined) userInStore.isVerified = body.isVerified ? 1 : 0;
        if (body.name !== undefined) userInStore.name = body.name;
        return c.json({ success: true, data: normalizeUserRow(userInStore) });
      }

      const setClauses: string[] = [];
      const values: any[] = [];
      if (body.membershipLevel !== undefined) { setClauses.push("membershipLevel = ?"); values.push(body.membershipLevel); }
      if (body.role !== undefined) { setClauses.push("role = ?"); values.push(body.role); }
      if (body.isVerified !== undefined) { setClauses.push("isVerified = ?"); values.push(body.isVerified ? 1 : 0); }
      if (body.name !== undefined) { setClauses.push("name = ?"); values.push(body.name); }

      if (setClauses.length === 0) return c.json({ success: false, error: "未提供任何更新字段" }, 400);

      values.push(id);
      await db.prepare(`UPDATE users SET ${setClauses.join(", ")} WHERE id = ?`).bind(...values).run();

      const updatedUser = await findUserById(c, id);
      if (!updatedUser) return c.json({ success: false, error: "用户不存在" }, 404);
      return c.json({ success: true, data: normalizeUserRow(updatedUser) });
    } catch (error: any) {
      return c.json({ success: false, error: error?.message || "更新用户失败" }, 500);
    }
  });

  // ── 删除用户（管理员） ──
  app.delete("/users/:id", authMiddleware, adminMiddleware, async (c) => {
    const id = c.req.param("id");
    const actor = c.get("jwtPayload") as JWTPayload;

    try {
      if (id === actor.id) {
        return c.json({ success: false, error: "不能删除当前登录的管理员账号" }, 400);
      }

      if (!c.env.DB) {
        const target = mockStore.users.find((u: any) => u.id === id);
        if (!target) return c.json({ success: false, error: "用户不存在" }, 404);
        if (target.role === "admin") {
          const adminCount = mockStore.users.filter((u: any) => u.role === "admin").length;
          if (adminCount <= 1) {
            return c.json({ success: false, error: "不能删除最后一个管理员" }, 400);
          }
        }
        const idx = mockStore.users.findIndex((u: any) => u.id === id);
        mockStore.users.splice(idx, 1);
        return c.body(null, 204);
      }

      const target = await c.env.DB.prepare("SELECT id, role FROM users WHERE id = ?").bind(id).first() as any;
      if (!target) return c.json({ success: false, error: "用户不存在" }, 404);

      if (target.role === "admin") {
        const adminCount = await c.env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").first("count");
        if (Number(adminCount) <= 1) {
          return c.json({ success: false, error: "不能删除最后一个管理员" }, 400);
        }
      }

      await c.env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
      return c.body(null, 204);
    } catch (error: any) {
      return c.json({ success: false, error: error?.message || "删除用户失败" }, 500);
    }
  });
}
