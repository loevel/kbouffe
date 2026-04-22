/**
 * Safe JSON body parser for Hono route handlers.
 *
 * Returns parsed body or null if parsing fails (instead of throwing).
 * Use this instead of `await c.req.json()` in all route handlers.
 */
import type { Context } from "hono";

export async function parseBody<T = any>(c: Context): Promise<T | null> {
    try {
        return await c.req.json<T>();
    } catch {
        return null;
    }
}
