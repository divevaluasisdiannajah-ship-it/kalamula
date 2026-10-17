/// <reference types="@cloudflare/workers-types" />

/**
 * Cloudflare environment bindings type declaration.
 * Augments the global `CloudflareEnv` interface so that
 * `getRequestContext().env.DB` is typed as a D1Database.
 */
interface CloudflareEnv {
  DB: D1Database;
}
