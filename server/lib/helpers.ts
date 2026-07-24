import * as bcrypt from "bcryptjs";
import { Bindings, JWTPayload } from "../types";
import { mockStore } from "../db";

// ── bcrypt 随机数回退（Cloudflare Workers 环境） ──
bcrypt.setRandomFallback((len) => {
  const array = new Uint8Array(len);
  crypto.getRandomValues(array);
  return Array.from(array);
});

export { bcrypt };

// ── 列缓存（避免每次请求都执行 PRAGMA） ──
const columnCache = new Map<string, boolean>();

export async function hasColumn(db: any, table: string, column: string) {
  const cacheKey = `${table}.${column}`;
  if (columnCache.has(cacheKey)) {
    return columnCache.get(cacheKey)!;
  }
  try {
    const { results } = await db.prepare(`PRAGMA table_info(${table})`).all();
    const columns = (results || []).map((item: any) => item.name);
    for (const col of columns) {
      columnCache.set(`${table}.${col}`, true);
    }
    const exists = columns.includes(column);
    if (!exists) columnCache.set(cacheKey, false);
    return exists;
  } catch {
    columnCache.set(cacheKey, false);
    return false;
  }
}

// ── 安全数据库操作 ──
export async function safePrepareRun(db: any, query: string, bindings: any[] = []) {
  try {
    return await db.prepare(query).bind(...bindings).run();
  } catch {
    return null;
  }
}

export async function safePrepareFirst(db: any, query: string, bindings: any[] = []) {
  try {
    return await db.prepare(query).bind(...bindings).first();
  } catch {
    return null;
  }
}

export async function safePrepareAll(db: any, query: string, bindings: any[] = []) {
  try {
    return await db.prepare(query).bind(...bindings).all();
  } catch {
    return { results: [] };
  }
}

// ── JSON 字段解析 ──
export function parseJsonField<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") {
    return (value as T) ?? fallback;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

// ── ID 生成 ──
export function generateId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

// ── JWT Secret ──
export function getJwtSecret(c: { env: Bindings }) {
  const secret = c.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing required binding: JWT_SECRET");
  }
  return secret;
}

/** Local-only demo users. Disabled on CF Pages / when ALLOW_DEV_FALLBACK !== "1". */
export function isDevFallbackEnabled(env: Bindings | undefined | null) {
  if (!env) return false;
  if (env.CF_PAGES === "1") return false;
  return env.ALLOW_DEV_FALLBACK === "1";
}

export function isStaffRole(role?: string) {
  return role === "admin" || role === "teacher";
}

// ── 会员层级规范化 ──
export function normalizeMembershipTier(level?: string) {
  const value = String(level || "").trim().toLowerCase();
  if (["core", "starter", "basic", "入门", "基础", "初级"].includes(value)) return "Core";
  if (["advanced", "进阶", "中级"].includes(value)) return "Advanced";
  if (["mastery", "master", "高阶", "精通", "高级"].includes(value)) return "Mastery";
  if (["elite", "certification", "认证", "职业认证"].includes(value)) return "Elite";
  return "Core";
}

export const membershipTierRank: Record<string, number> = {
  Core: 1,
  Advanced: 2,
  Mastery: 3,
  Elite: 4,
};

export function hasCourseAccess(user: any, courseLevel?: string) {
  if (!user || isStaffRole(user.role)) return true;
  return membershipTierRank[normalizeMembershipTier(courseLevel)] <= membershipTierRank[normalizeMembershipTier(user.membershipLevel)];
}

// ── 行规范化函数 ──
export function normalizeUserRow(row: any) {
  return {
    id: row.id,
    uid: row.uid,
    email: row.email,
    name: row.name,
    role: row.role,
    membershipLevel: row.membershipLevel || "Core",
    isVerified: row.isVerified === 1 || row.isVerified === true,
    avatar: row.avatar || undefined,
    learningGoal: row.learningGoal || undefined,
    createdAt: row.createdAt,
  };
}

export function normalizeCourseRow(row: any) {
  const normalizedLevel = normalizeMembershipTier(row.level);
  const modules = parseJsonField(row.modules, [] as any[]);
  const hasVideo =
    Boolean(row.videoUrl) ||
    (Array.isArray(modules) && modules.some((module: any) => Boolean(module?.videoUrl)));

  return {
    ...row,
    level: normalizedLevel,
    students: Number(row.students || 0),
    progress: typeof row.progress === "number" ? row.progress : Number(row.progress || 0),
    price: typeof row.price === "number" ? row.price : Number(row.price || 0),
    modules,
    hasVideo,
  };
}

export function normalizeCourseWithAccess(course: any, viewer: JWTPayload) {
  const isAccessible = hasCourseAccess(viewer, course.level);
  return {
    ...course,
    isAccessible,
    accessReason: isAccessible ? undefined : `当前账号仅可学习 ${normalizeMembershipTier(viewer?.membershipLevel)} 及以下内容`,
  };
}

export function normalizeSubmissionRow(row: any) {
  return {
    id: row.id,
    studentId: row.studentId,
    assignmentId: row.assignmentId,
    assignmentTitle: row.assignmentTitle,
    courseTitle: row.courseTitle,
    studentName: row.studentName,
    fileUrl: row.fileUrl,
    remark: row.remark || "",
    submittedAt: row.submittedAt,
    grade: row.grade,
    feedback: row.feedback,
    gradedAt: row.gradedAt || undefined,
  };
}

export function normalizeAssignmentRow(row: any) {
  return {
    id: row.id,
    title: row.title,
    courseId: row.courseId,
    course: row.course || row.courseTitle || "",
    description: row.description || "",
    dueDate: row.dueDate || "",
    createdAt: row.createdAt,
  };
}

// ── 资源推断 ──
export function inferResourceTypeFromUrl(url: string) {
  const normalized = String(url || "").toLowerCase();
  if (normalized.endsWith(".pdf")) return "pdf";
  if (normalized.endsWith(".zip") || normalized.endsWith(".rar") || normalized.endsWith(".7z")) return "zip";
  if (normalized.endsWith(".xls") || normalized.endsWith(".xlsx") || normalized.endsWith(".csv")) return "excel";
  if (normalized.endsWith(".doc") || normalized.endsWith(".docx") || normalized.endsWith(".txt")) return "document";
  if (normalized.endsWith(".mp4") || normalized.endsWith(".mov") || normalized.endsWith(".webm") || normalized.endsWith(".m3u8")) return "video";
  return "document";
}

export function getFileNameFromUrl(url: string, fallback: string) {
  try {
    const segment = new URL(url, "https://local.resource").pathname.split("/").filter(Boolean).pop();
    return segment ? decodeURIComponent(segment) : fallback;
  } catch {
    return fallback;
  }
}

export function buildResourcesFromCourses(courses: any[]) {
  const baseDate = new Date().toISOString().slice(0, 10);

  return courses.flatMap((course) => {
    const resources: any[] = [];

    if (course.pdfUrl) {
      resources.push({
        id: `${course.id}-pdf`,
        name: getFileNameFromUrl(course.pdfUrl, `${course.title}-课件.pdf`),
        size: "在线资料",
        type: inferResourceTypeFromUrl(course.pdfUrl),
        date: baseDate,
        url: course.pdfUrl,
        courseId: course.id,
        courseTitle: course.title,
        source: "course",
        level: course.level,
        isAccessible: course.isAccessible !== false,
        accessReason: course.accessReason,
      });
    }

    if (course.videoUrl) {
      resources.push({
        id: `${course.id}-video`,
        name: getFileNameFromUrl(course.videoUrl, `${course.title}-课程视频`),
        size: "在线视频",
        type: inferResourceTypeFromUrl(course.videoUrl),
        date: baseDate,
        url: course.videoUrl,
        courseId: course.id,
        courseTitle: course.title,
        source: "course",
        level: course.level,
        isAccessible: course.isAccessible !== false,
        accessReason: course.accessReason,
      });
    }

    (course.modules || []).forEach((module: any, index: number) => {
      if (!module?.videoUrl) return;
      resources.push({
        id: `${course.id}-lesson-${module.id || index}`,
        name: getFileNameFromUrl(module.videoUrl, `${course.title}-${module.title || `lesson-${index + 1}`}`),
        size: module.duration || "章节资料",
        type: inferResourceTypeFromUrl(module.videoUrl),
        date: baseDate,
        url: module.videoUrl,
        courseId: course.id,
        courseTitle: course.title,
        lessonId: String(module.id || `lesson-${index + 1}`),
        lessonTitle: module.title,
        source: "lesson",
        level: course.level,
        isAccessible: course.isAccessible !== false,
        accessReason: course.accessReason,
      });
    });

    return resources;
  });
}

// ── 开发用回退用户（仅 ALLOW_DEV_FALLBACK=1 时可用） ──
export function getDevUsers() {
  return [
    {
      id: "admin-local",
      uid: "admin-local",
      email: "admin@mt.com",
      name: "管理员",
      role: "admin",
      membershipLevel: "Elite",
      isVerified: true,
      avatar: undefined,
      learningGoal: "管理课程内容、跟进学生学习进度，并维护直播答疑安排。",
      createdAt: new Date().toISOString(),
      password: "123456",
      __source: "fallback" as const,
    },
    {
      id: "teacher-local",
      uid: "teacher-local",
      email: "teacher@mt.com",
      name: "授课老师",
      role: "teacher",
      membershipLevel: "Elite",
      isVerified: true,
      avatar: undefined,
      learningGoal: "发布课程与作业、批改提交，并维护直播答疑安排。",
      createdAt: new Date().toISOString(),
      password: "123456",
      __source: "fallback" as const,
    },
    {
      id: "student-local",
      uid: "student-local",
      email: "student@mt.com",
      name: "学生用户",
      role: "student",
      membershipLevel: "Advanced",
      isVerified: true,
      avatar: undefined,
      learningGoal: "完成当前课程学习、参与直播答疑，并按时提交作业。",
      createdAt: new Date().toISOString(),
      password: "123456",
      __source: "fallback" as const,
    },
  ];
}

export function isFallbackUser(user: any) {
  return user?.__source === "fallback";
}

// ── 用户数据库读写 ──
export async function readUserByIdWithFallback(db: any, id: string) {
  const supportsMembershipLevel = await hasColumn(db, "users", "membershipLevel");
  const supportsAvatar = await hasColumn(db, "users", "avatar");
  const supportsLearningGoal = await hasColumn(db, "users", "learningGoal");

  const selectFields = [
    "id", "uid", "email", "name", "role",
    supportsMembershipLevel ? "membershipLevel" : "'Core' AS membershipLevel",
    "isVerified",
    supportsAvatar ? "avatar" : "NULL AS avatar",
    supportsLearningGoal ? "learningGoal" : "NULL AS learningGoal",
    "createdAt",
  ].join(", ");

  return safePrepareFirst(db, `SELECT ${selectFields} FROM users WHERE id = ?`, [id]);
}

export async function readUsersWithFallback(db: any) {
  const supportsMembershipLevel = await hasColumn(db, "users", "membershipLevel");
  const supportsAvatar = await hasColumn(db, "users", "avatar");
  const supportsLearningGoal = await hasColumn(db, "users", "learningGoal");

  const selectFields = [
    "id", "uid", "email", "name", "role",
    supportsMembershipLevel ? "membershipLevel" : "'Core' AS membershipLevel",
    "isVerified",
    supportsAvatar ? "avatar" : "NULL AS avatar",
    supportsLearningGoal ? "learningGoal" : "NULL AS learningGoal",
    "createdAt",
  ].join(", ");

  const result = await safePrepareAll(db, `SELECT ${selectFields} FROM users ORDER BY createdAt DESC`);
  return result.results || [];
}

export async function findUserByEmail(c: any, email: string) {
  const db = c.env.DB;
  if (db) {
    const dbUser = await safePrepareFirst(db, "SELECT * FROM users WHERE email = ?", [email]);
    if (dbUser) return { ...dbUser, __source: "db" as const };
  }

  // In-memory mock users (local node server / tests)
  const mockUser = mockStore.users.find((user) => user.email === email);
  if (mockUser) return { ...mockUser, __source: "mock" as const };

  // Hardcoded demo users only when explicitly enabled for local preview
  if (isDevFallbackEnabled(c.env)) {
    const fallbackUser = getDevUsers().find((user) => user.email === email) || null;
    return fallbackUser ? { ...fallbackUser, __source: "fallback" as const } : null;
  }

  return null;
}

export async function findUserById(c: any, id: string) {
  const db = c.env.DB;
  if (db) {
    const dbUser = await readUserByIdWithFallback(db, id);
    if (dbUser) return { ...dbUser, __source: "db" as const };
    // User was deleted or never existed in D1 — do NOT resurrect as fallback.
    // Only fall through when DB is completely unavailable (handled below).
    if (!isDevFallbackEnabled(c.env)) return null;
  }

  const mockUser = mockStore.users.find((item) => item.id === id);
  if (mockUser) {
    const { password: _mp, ...mockSafe } = mockUser;
    return { ...mockSafe, __source: "mock" as const };
  }

  if (isDevFallbackEnabled(c.env) && !db) {
    const devUser = getDevUsers().find((item) => item.id === id);
    if (!devUser) return null;
    const { password: _dp, ...devSafe } = devUser;
    return { ...devSafe, __source: "fallback" as const };
  }

  return null;
}

/** Fresh membership/role from DB for access control (do not trust JWT alone). */
export async function resolveViewerFromDb(c: any, payload: JWTPayload) {
  const user = await findUserById(c, payload.id);
  if (!user) return null;
  return {
    ...payload,
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    membershipLevel: user.membershipLevel || "Core",
  } as JWTPayload & { membershipLevel: string };
}

export async function createUser(c: any, payload: { id: string; email: string; name: string; password: string }) {
  const db = c.env.DB;
  if (!db) {
    const hashedPassword = await bcrypt.hash(payload.password, 10);
    const newUser = {
      id: payload.id, uid: payload.id, email: payload.email, password: hashedPassword,
      name: payload.name, role: "student", membershipLevel: "Core", isVerified: 0,
      createdAt: new Date().toISOString(),
    };
    mockStore.users.push(newUser);
    return { ...newUser, __source: "mock" as const };
  }

  try {
    const hashedPassword = await bcrypt.hash(payload.password, 10);
    const supportsMembershipLevel = await hasColumn(db, "users", "membershipLevel");

    if (supportsMembershipLevel) {
      await db.prepare(
        "INSERT INTO users (id, uid, email, password, name, role, membershipLevel, isVerified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(payload.id, payload.id, payload.email, hashedPassword, payload.name, "student", "Core", 0).run();
    } else {
      await db.prepare(
        "INSERT INTO users (id, uid, email, password, name, role, isVerified) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).bind(payload.id, payload.id, payload.email, hashedPassword, payload.name, "student", 0).run();
    }

    return await findUserById(c, payload.id);
  } catch (error) {
    console.warn("[createUser] falling back to in-memory preview user");
    if (!isDevFallbackEnabled(c.env)) throw error;
    const hashedPassword = await bcrypt.hash(payload.password, 10);
    const fallbackUser = {
      id: payload.id, uid: payload.id, email: payload.email, password: hashedPassword,
      name: payload.name, role: "student", membershipLevel: "Core", isVerified: 0,
      createdAt: new Date().toISOString(),
    };
    mockStore.users.push(fallbackUser);
    return { ...fallbackUser, __source: "mock" as const };
  }
}

// ── 提交记录读写 ──
export async function readSubmissionsWithFallback(db: any, user: JWTPayload) {
  const withRemark = `
    SELECT submissions.id, submissions.studentId, submissions.assignmentId,
      submissions.fileUrl, submissions.remark, submissions.submittedAt,
      submissions.grade, submissions.feedback, submissions.gradedAt,
      assignments.title AS assignmentTitle, assignments.courseId,
      courses.title AS courseTitle, users.name AS studentName
    FROM submissions
    LEFT JOIN assignments ON assignments.id = submissions.assignmentId
    LEFT JOIN courses ON courses.id = assignments.courseId
    LEFT JOIN users ON users.id = submissions.studentId
  `;

  const withoutRemark = withRemark.replace("submissions.remark,", "'' AS remark,");

  const isStaff = isStaffRole(user.role);
  const adminQ = `${withRemark} ORDER BY submissions.submittedAt DESC`;
  const studentQ = `${withRemark} WHERE submissions.studentId = ? ORDER BY submissions.submittedAt DESC`;
  const adminFb = `${withoutRemark} ORDER BY submissions.submittedAt DESC`;
  const studentFb = `${withoutRemark} WHERE submissions.studentId = ? ORDER BY submissions.submittedAt DESC`;

  const preferred = isStaff
    ? await safePrepareAll(db, adminQ)
    : await safePrepareAll(db, studentQ, [user.id]);

  if ((preferred.results || []).length) return preferred.results;

  const fallback = isStaff
    ? await safePrepareAll(db, adminFb)
    : await safePrepareAll(db, studentFb, [user.id]);

  return fallback.results || [];
}

export async function readSubmissionByIdWithFallback(db: any, id: string) {
  const withRemark = `
    SELECT submissions.id, submissions.studentId, submissions.assignmentId,
      submissions.fileUrl, submissions.remark, submissions.submittedAt,
      submissions.grade, submissions.feedback, submissions.gradedAt,
      assignments.title AS assignmentTitle, courses.title AS courseTitle,
      users.name AS studentName
    FROM submissions
    LEFT JOIN assignments ON assignments.id = submissions.assignmentId
    LEFT JOIN courses ON courses.id = assignments.courseId
    LEFT JOIN users ON users.id = submissions.studentId
    WHERE submissions.id = ?
  `;

  const preferred = await safePrepareFirst(db, withRemark, [id]);
  if (preferred) return preferred;

  return safePrepareFirst(db, withRemark.replace("submissions.remark,", "'' AS remark,"), [id]);
}

export async function insertSubmissionWithFallback(db: any, values: { id: string; userId: string; assignmentId: string; fileUrl: string; remark: string }) {
  try {
    await db.prepare(
      "INSERT INTO submissions (id, studentId, assignmentId, fileUrl, remark) VALUES (?, ?, ?, ?, ?)"
    ).bind(values.id, values.userId, values.assignmentId, values.fileUrl, values.remark || null).run();
    return;
  } catch (error: any) {
    if (!String(error?.message || "").includes("no column named remark")) throw error;
  }
  await db.prepare(
    "INSERT INTO submissions (id, studentId, assignmentId, fileUrl) VALUES (?, ?, ?, ?)"
  ).bind(values.id, values.userId, values.assignmentId, values.fileUrl).run();
}

export async function ensurePreviewUserExists(db: any, user: JWTPayload, env?: Bindings) {
  if (env && !isDevFallbackEnabled(env)) return;

  const existing = await safePrepareFirst(db, "SELECT id FROM users WHERE id = ?", [user.id]);
  if (existing) return;

  const fallbackUser = getDevUsers().find((item) => item.id === user.id);
  if (!fallbackUser) return;

  const hashedPassword = await bcrypt.hash(fallbackUser.password, 10);
  const supportsMembershipLevel = await hasColumn(db, "users", "membershipLevel");

  try {
    if (supportsMembershipLevel) {
      await db.prepare(
        "INSERT INTO users (id, uid, email, password, name, role, membershipLevel, isVerified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(fallbackUser.id, fallbackUser.uid, fallbackUser.email, hashedPassword, fallbackUser.name, fallbackUser.role, fallbackUser.membershipLevel, fallbackUser.isVerified ? 1 : 0).run();
    } else {
      await db.prepare(
        "INSERT INTO users (id, uid, email, password, name, role, isVerified) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).bind(fallbackUser.id, fallbackUser.uid, fallbackUser.email, hashedPassword, fallbackUser.name, fallbackUser.role, fallbackUser.isVerified ? 1 : 0).run();
    }
  } catch {
    // Ignore race conditions
  }
}

/** Build a browser-accessible asset URL for an R2 object key. */
export function assetUrlFromKey(key: string) {
  const normalized = String(key || "").replace(/^\/+/, "");
  return `/api/assets/${normalized}`;
}

export function isAssetKey(value?: string | null) {
  if (!value) return false;
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/api/")) return false;
  return /^(images|videos|submissions)\//.test(value);
}
