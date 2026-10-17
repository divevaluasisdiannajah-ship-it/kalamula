/**
 * SIAP SEKOLAH — Drizzle DB Client (Cloudflare D1)
 *
 * Returns a Drizzle instance bound to the D1 database injected
 * by Cloudflare Pages/Workers at request time.
 *
 * Usage in API routes (edge runtime):
 *   import { getDB } from '@/db';
 *   const db = getDB();
 *   const rows = await db.select().from(users).all();
 */

import { drizzle } from "drizzle-orm/d1";
import { getRequestContext } from "@cloudflare/next-on-pages";
import * as schema from "./schema";

export type DB = ReturnType<typeof drizzle>;

export function getDB(): DB {
  const { env } = getRequestContext();
  return drizzle(env.DB, { schema });
}

// Re-export schema tables for convenience
export * from "./schema";
