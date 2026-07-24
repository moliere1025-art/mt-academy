import { Hono } from "hono";
import { Bindings, JWTPayload } from "../types";
import { assetUrlFromKey, isStaffRole, resolveViewerFromDb } from "../lib/helpers";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const ALLOWED_DOC_TYPES = [
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;  // 10MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_DOC_SIZE = 30 * 1024 * 1024;    // 30MB

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 128);
}

function normalizeKey(raw: string) {
  return decodeURIComponent(raw || "")
    .replace(/^\/+/, "")
    .replace(/\\/g, "/")
    .replace(/\.\./g, "");
}

export function registerUploadRoutes(
  app: Hono<{ Bindings: Bindings }>,
  authMiddleware: any,
  staffMiddleware: any,
) {
  // ── 读取 R2 资产（鉴权代理） ──
  app.get("/assets/:key{.+}", authMiddleware, async (c) => {
    const bucket = c.env.COURSE_ASSETS;
    if (!bucket) {
      return c.json({ success: false, error: "未配置课程资源存储" }, 501);
    }

    const payload = c.get("jwtPayload") as JWTPayload;
    const viewer = (await resolveViewerFromDb(c, payload)) || payload;
    const wildcard = c.req.param("key") || c.req.path.replace(/^\/api\/assets\/?/, "");
    const key = normalizeKey(String(wildcard));
    if (!key) return c.json({ success: false, error: "无效的资源路径" }, 400);

    // Students may only read their own submission files; staff can read all.
    if (key.startsWith("submissions/")) {
      const ownerId = key.split("/")[1];
      if (!isStaffRole(viewer.role) && ownerId !== viewer.id) {
        return c.json({ success: false, error: "无权访问该文件" }, 403);
      }
    } else if (!viewer.id) {
      return c.json({ success: false, error: "未登录" }, 401);
    }

    const object = await bucket.get(key);
    if (!object) return c.json({ success: false, error: "文件不存在" }, 404);

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Cache-Control", "private, max-age=3600");
    if (!headers.get("Content-Type")) {
      headers.set("Content-Type", "application/octet-stream");
    }

    return new Response(object.body, { headers });
  });

  // ── 上传图片（课程资产：staff） ──
  app.post("/upload", authMiddleware, staffMiddleware, async (c) => {
    const bucket = c.env.COURSE_ASSETS;
    if (!bucket) {
      return c.json({ success: false, error: "未配置课程资源存储" }, 501);
    }

    const body = await c.req.parseBody();
    const file = body.file;
    if (!(file instanceof File)) {
      return c.json({ success: false, error: "请选择要上传的文件" }, 400);
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return c.json({ success: false, error: `图片大小不能超过 ${MAX_IMAGE_SIZE / 1024 / 1024}MB` }, 400);
    }

    if (file.type && !ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return c.json({ success: false, error: "不支持的图片格式，请使用 JPG/PNG/GIF/WebP" }, 400);
    }

    const safeName = sanitizeFileName(file.name);
    const key = `images/${Date.now()}-${safeName}`;
    await bucket.put(key, await file.arrayBuffer(), {
      httpMetadata: {
        contentType: file.type || "application/octet-stream",
      },
    });

    const url = assetUrlFromKey(key);
    return c.json({ success: true, key, url });
  });

  // ── 上传视频（课程资产：staff） ──
  app.post("/upload/video", authMiddleware, staffMiddleware, async (c) => {
    const bucket = c.env.COURSE_ASSETS;
    if (!bucket) {
      return c.json({ success: false, error: "未配置课程资源存储" }, 501);
    }

    const body = await c.req.parseBody();
    const file = body.file;
    if (!(file instanceof File)) {
      return c.json({ success: false, error: "请选择要上传的视频文件" }, 400);
    }

    if (file.size > MAX_VIDEO_SIZE) {
      return c.json({ success: false, error: `视频大小不能超过 ${MAX_VIDEO_SIZE / 1024 / 1024}MB` }, 400);
    }

    if (file.type && !ALLOWED_VIDEO_TYPES.includes(file.type)) {
      return c.json({ success: false, error: "不支持的视频格式，请使用 MP4/WebM/MOV" }, 400);
    }

    const safeName = sanitizeFileName(file.name);
    const key = `videos/${Date.now()}-${safeName}`;
    await bucket.put(key, await file.arrayBuffer(), {
      httpMetadata: {
        contentType: file.type || "application/octet-stream",
      },
    });

    const url = assetUrlFromKey(key);
    return c.json({ success: true, key, url });
  });

  // ── 学生作业附件上传 ──
  app.post("/upload/submission", authMiddleware, async (c) => {
    const bucket = c.env.COURSE_ASSETS;
    if (!bucket) {
      return c.json({ success: false, error: "未配置课程资源存储" }, 501);
    }

    const payload = c.get("jwtPayload") as JWTPayload;
    const viewer = (await resolveViewerFromDb(c, payload)) || payload;
    const body = await c.req.parseBody();
    const file = body.file;
    if (!(file instanceof File)) {
      return c.json({ success: false, error: "请选择要上传的作业文件" }, 400);
    }

    if (file.size > MAX_DOC_SIZE) {
      return c.json({ success: false, error: `文件大小不能超过 ${MAX_DOC_SIZE / 1024 / 1024}MB` }, 400);
    }

    if (file.type && !ALLOWED_DOC_TYPES.includes(file.type) && !file.type.startsWith("image/")) {
      return c.json({ success: false, error: "不支持的文件格式" }, 400);
    }

    const safeName = sanitizeFileName(file.name);
    const key = `submissions/${viewer.id}/${Date.now()}-${safeName}`;
    await bucket.put(key, await file.arrayBuffer(), {
      httpMetadata: {
        contentType: file.type || "application/octet-stream",
      },
    });

    const url = assetUrlFromKey(key);
    return c.json({ success: true, key, url });
  });
}
