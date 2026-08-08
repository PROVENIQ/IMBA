import { Pool } from "@neondatabase/serverless";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";

import * as schema from "./schema";

// Lazily-initialized Neon/Drizzle client. Reads DATABASE_URL at runtime so the app
// still builds and boots without a database — persistence routes surface a clear
// "not configured" state instead of crashing. Uses the WebSocket pool driver so the
// repository can run atomic transactions (version + workspace + audit together).

export type Db = NeonDatabase<typeof schema>;

let cached: Db | null = null;

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb(): Db | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  if (!cached) {
    const pool = new Pool({ connectionString });
    cached = drizzle(pool, { schema });
  }
  return cached;
}
