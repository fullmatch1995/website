import { createMiddleware } from "hono/factory";

// Replaces passport + express-session with stateless JWT auth.
// Uses the Web Crypto API (available natively in Cloudflare Workers).

// ─── Token generation ────────────────────────────────────────────────────────

export async function generateToken(userId: string, secret: string): Promise<string> {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({ sub: userId, iat: Date.now() }));
  const signature = await sign(`${header}.${payload}`, secret);
  return `${header}.${payload}.${signature}`;
}

// ─── Token verification ──────────────────────────────────────────────────────

export async function verifyToken(
  token: string,
  secret: string
): Promise<{ userId: string } | null> {
  try {
    const [header, payload, signature] = token.split(".");
    const expected = await sign(`${header}.${payload}`, secret);
    if (expected !== signature) return null;
    const decoded = JSON.parse(atob(payload));
    return { userId: decoded.sub };
  } catch {
    return null;
  }
}

// ─── HMAC-SHA256 signing ─────────────────────────────────────────────────────

async function sign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

// ─── Auth middleware ─────────────────────────────────────────────────────────

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const token = authHeader.slice(7);
  const secret = (c.env as { JWT_SECRET: string }).JWT_SECRET;
  const result = await verifyToken(token, secret);

  if (!result) {
    return c.json({ message: "Invalid or expired token" }, 401);
  }

  c.set("userId" as never, result.userId);
  await next();
});
