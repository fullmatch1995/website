import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { registerRoutes } from "./routes";

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use("*", logger());
app.use(
  "/api/*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// Register all API routes
registerRoutes(app);

// Serve static frontend assets (built by Vite, placed in /public)
app.get("/{*path}", async (c) => {
  // In Cloudflare Pages, static assets are handled automatically.
  // This fallback serves index.html for client-side routing.
  return c.html(`<!DOCTYPE html>
<html lang="en">
  <head><meta charset="UTF-8" /><title>App</title></head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`);
});

export default app;
