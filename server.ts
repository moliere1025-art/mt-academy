import { serve } from "@hono/node-server";
import app from "./server/app";

const port = 3000;

// Only start the standalone server if we are in production and NOT running via Vite
if (process.env.NODE_ENV === "production" && !process.env.VITE) {
  console.log(`[Standalone] Server is running on port ${port}`);
  serve({
    fetch: app.fetch,
    port,
  });
}

export default app;
