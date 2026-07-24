import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { cors } from "hono/cors";
import { Bindings, JWTPayload } from "./types";
import { getJwtSecret, getDevUsers, isDevFallbackEnabled, isStaffRole } from "./lib/helpers";
import { registerAuthRoutes } from "./routes/auth";
import { registerCourseRoutes } from "./routes/courses";
import { registerSubmissionRoutes } from "./routes/submissions";
import { registerLiveRoutes } from "./routes/live";
import { registerUploadRoutes } from "./routes/upload";
import { registerEnrollmentRoutes } from "./routes/enrollments";
import { encodingMiddleware } from "./middleware/encoding";

const app = new Hono<{ Bindings: Bindings }>().basePath("/api");

// ── 全局中间件 ──
app.use("*", async (c, next) => {
  const configured = c.env.ALLOWED_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173";
  const origins = configured.split(",").map((item) => item.trim()).filter(Boolean);
  const requestOrigin = c.req.header("Origin");
  const allowOrigin =
    requestOrigin && origins.includes(requestOrigin)
      ? requestOrigin
      : origins[0] || "http://localhost:5173";

  const corsMiddleware = cors({
    origin: allowOrigin,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });

  return corsMiddleware(c, next);
});

app.use("*", encodingMiddleware);

app.use("*", async (c, next) => {
  console.log(`[Hono] ${c.req.method} ${c.req.url}`);
  await next();
});

// ── 鉴权中间件 ──
const authMiddleware = (c: any, next: any) => {
  return jwt({
    secret: getJwtSecret(c),
    alg: "HS256",
  })(c, next);
};

/** Strict admin-only (user management, system settings). */
const adminMiddleware = async (c: any, next: any) => {
  const user = c.get("jwtPayload") as JWTPayload;
  if (user?.role !== "admin") {
    return c.json({ success: false, error: "无权访问，仅限管理员" }, 403);
  }
  await next();
};

/** Admin or teacher (courses, assignments, grading, live). */
const staffMiddleware = async (c: any, next: any) => {
  const user = c.get("jwtPayload") as JWTPayload;
  if (!isStaffRole(user?.role)) {
    return c.json({ success: false, error: "无权访问，仅限管理员或老师" }, 403);
  }
  await next();
};

// ── 健康检查 ──
app.get("/ping", (c) => c.text("pong"));

app.get("/health", async (c) => {
  try {
    if (!c.env.DB) {
      const fallbackOn = isDevFallbackEnabled(c.env);
      return c.json({
        status: "ok",
        usersCount: fallbackOn ? getDevUsers().length : 0,
        mode: fallbackOn ? "fallback" : "no-db",
      });
    }
    const usersCount = await c.env.DB.prepare("SELECT COUNT(*) as count FROM users").first("count");
    return c.json({ status: "ok", usersCount, mode: "d1" });
  } catch (error: any) {
    return c.json({ status: "error", message: error.message }, 500);
  }
});

// ── 注册路由模块 ──
registerAuthRoutes(app, authMiddleware, adminMiddleware);
registerCourseRoutes(app, authMiddleware, staffMiddleware);
registerSubmissionRoutes(app, authMiddleware, staffMiddleware);
registerLiveRoutes(app, authMiddleware, staffMiddleware);
registerUploadRoutes(app, authMiddleware, staffMiddleware);
registerEnrollmentRoutes(app, authMiddleware);

// ── 全局错误处理 ──
app.onError((error, c) => {
  console.error("[Hono] Unhandled error", error);
  return c.json({ success: false, error: error?.message || "服务器内部错误" }, 500);
});

export default app;
