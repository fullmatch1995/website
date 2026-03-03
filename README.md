# Deploying projekti-im to Cloudflare Workers

## What changed from your original Express project

| Original (Node/Express) | Cloudflare Workers replacement |
|---|---|
| `express` | `hono` |
| `express-session` + `passport` | JWT via Web Crypto API |
| `pg` + PostgreSQL | Cloudflare D1 (SQLite) |
| `fs`, `path`, `__dirname` | Removed (not available in Workers) |
| `MemStorage` (in-memory Map) | `D1Storage` (persistent D1 database) |
| `http.createServer` | Hono handles the request/response lifecycle |
| Vite dev server (runtime) | Vite builds static files; Workers serves them |

---

## Step-by-step deployment

### 1. Install Wrangler CLI
```bash
npm install -g wrangler
wrangler login
```

### 2. Install project dependencies
```bash
cd cloudflare-worker
npm install
```

### 3. Create the D1 database
```bash
npm run db:create
```
Copy the `database_id` printed in the output and paste it into `wrangler.toml`:
```toml
database_id = "paste-your-id-here"
```

### 4. Run the database migration
```bash
# Local dev
npm run db:migrate:local

# Production
npm run db:migrate
```

### 5. Set your JWT secret
```bash
wrangler secret put JWT_SECRET
# Enter a long random string when prompted
```

### 6. Build your Vite frontend
In your original project root:
```bash
npm run build
```
Then copy the output (`dist/public` or `dist/client`) into the `dist/public` folder of this worker project.

### 7. Run locally
```bash
npm run dev
```
Your worker runs at `http://localhost:8787`

### 8. Deploy to Cloudflare
```bash
npm run deploy
```

---

## Adding new routes

Open `src/routes.ts` and add routes inside `registerRoutes`:

```ts
app.get("/api/items", async (c) => {
  const storage = getStorage(c.env.DB);
  // ...
  return c.json({ items: [] });
});
```

## Password hashing (important for production!)

The current code stores passwords as plain text (matching your original `MemStorage`).
Before going live, hash passwords using the Web Crypto API:

```ts
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}
```
