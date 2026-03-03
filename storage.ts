// Storage layer using Cloudflare D1 (SQLite)
// Replaces the in-memory MemStorage from the original Node/Express project.

export interface User {
  id: string;
  username: string;
  password: string;
}

export interface InsertUser {
  username: string;
  password: string;
}

export class D1Storage {
  constructor(private db: D1Database) {}

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db
      .prepare("SELECT * FROM users WHERE id = ?")
      .bind(id)
      .first<User>();
    return result ?? undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db
      .prepare("SELECT * FROM users WHERE username = ?")
      .bind(username)
      .first<User>();
    return result ?? undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = crypto.randomUUID(); // Web Crypto API — available in Workers
    await this.db
      .prepare("INSERT INTO users (id, username, password) VALUES (?, ?, ?)")
      .bind(id, insertUser.username, insertUser.password)
      .run();
    return { id, ...insertUser };
  }
}

// Factory so each request gets a fresh storage instance bound to D1
export function getStorage(db: D1Database): D1Storage {
  return new D1Storage(db);
}
