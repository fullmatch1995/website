import { Hono } from "hono";
import { getStorage } from "./storage";
import { authMiddleware, generateToken } from "./auth";
import type { Env } from "./index";

export function registerRoutes(app: Hono<{ Bindings: Env }>) {
  // ─── Auth Routes ────────────────────────────────────────────────────────────

  // POST /api/register
  app.post("/api/register", async (c) => {
    const body = await c.req.json();
    const { username, password } = body;

    if (!username || !password) {
      return c.json({ message: "Username and password are required" }, 400);
    }

    const storage = getStorage(c.env.DB);
    const existing = await storage.getUserByUsername(username);
    if (existing) {
      return c.json({ message: "Username already taken" }, 409);
    }

    const user = await storage.createUser({ username, password });
    const token = await generateToken(user.id, c.env.JWT_SECRET);
    return c.json({ user: { id: user.id, username: user.username }, token }, 201);
  });

  // POST /api/login
  app.post("/api/login", async (c) => {
    const body = await c.req.json();
    const { username, password } = body;

    if (!username || !password) {
      return c.json({ message: "Username and password are required" }, 400);
    }

    const storage = getStorage(c.env.DB);
    const user = await storage.getUserByUsername(username);
    if (!user || user.password !== password) {
      return c.json({ message: "Invalid credentials" }, 401);
    }

    const token = await generateToken(user.id, c.env.JWT_SECRET);
    return c.json({ user: { id: user.id, username: user.username }, token });
  });

  // GET /api/me  (protected)
  app.get("/api/me", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;
    const storage = getStorage(c.env.DB);
    const user = await storage.getUser(userId);
    if (!user) return c.json({ message: "User not found" }, 404);
    return c.json({ id: user.id, username: user.username });
  });

  // ─── Add your own routes below ──────────────────────────────────────────────
  // All routes should be prefixed with /api
  // Example:
  //   app.get("/api/items", async (c) => { ... })
  //   app.post("/api/items", authMiddleware, async (c) => { ... })
}
