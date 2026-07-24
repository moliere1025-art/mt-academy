import { Context, Next } from "hono";

/**
 * Only rewrite request bodies when the client explicitly claims a GBK charset,
 * or when ASSUME_GBK_CURL=1 is set for local curl debugging on Windows.
 * Browser/axios traffic is always UTF-8 and must not be re-decoded.
 */
export async function encodingMiddleware(c: Context, next: Next) {
  const method = c.req.method;
  if (method === "GET" || method === "OPTIONS" || method === "HEAD") {
    return next();
  }

  const contentType = c.req.header("content-type") || "";
  if (!contentType.includes("application/json")) {
    return next();
  }

  const charsetMatch = contentType.match(/charset=([^\s;]+)/i);
  const charset = (charsetMatch?.[1] || "").toLowerCase().replace(/["']/g, "");
  const forceGbk = c.env?.ASSUME_GBK_CURL === "1";
  const claimsGbk = charset === "gbk" || charset === "gb2312" || charset === "gb18030";

  if (!claimsGbk && !forceGbk) {
    return next();
  }

  const rawBody = await c.req.arrayBuffer();
  const bytes = new Uint8Array(rawBody);

  try {
    const gbkText = new TextDecoder("gbk").decode(bytes);
    JSON.parse(gbkText);
    const init: RequestInit = {
      method,
      headers: new Headers(c.req.raw.headers),
    };
    (init.headers as Headers).set("content-type", "application/json; charset=utf-8");
    const newReq = new Request(c.req.url, { ...init, body: gbkText });
    Object.defineProperty(c.req, "raw", { value: newReq, writable: true, configurable: true });
  } catch {
    // Leave the original body alone if re-decode fails
  }

  return next();
}
