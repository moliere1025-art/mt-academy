export interface JWTPayload {
  id: string;
  email: string;
  name?: string;
  role: string;
  membershipLevel?: string;
  exp: number;
}

export type UserRole = "admin" | "teacher" | "student";

export type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  COURSE_ASSETS?: R2Bucket;
  APP_CONFIG?: KVNamespace;
  /** "1" enables local-only hardcoded demo users. Never set in production. */
  ALLOW_DEV_FALLBACK?: string;
  /** Comma-separated browser origins for CORS. */
  ALLOWED_ORIGINS?: string;
  /** Present on Cloudflare Pages production/preview. */
  CF_PAGES?: string;
};
