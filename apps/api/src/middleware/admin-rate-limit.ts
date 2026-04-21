/**
 * Admin-specific middleware:
 *  - adminMutationRateLimiter: 60 POST/PATCH/PUT/DELETE per minute per userId
 *  - adminBodySizeLimiter:     reject bodies > 1 MB before any parsing
 */
import type { Context, Next } from "hono";
import type { Env, Variables } from "../types";
import { checkRateLimit } from "../lib/rate-limiter-do";

type AdminCtx = Context<{ Bindings: Env; Variables: Variables }>;

// ── Rate limiter ─────────────────────────────────────────────────────
const MUTATION_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_MUTATIONS = 60;

export async function adminMutationRateLimiter(
    c: AdminCtx,
    next: Next,
): Promise<Response | void> {
    if (!MUTATION_METHODS.has(c.req.method)) {
        await next();
        return;
    }

    const userId = c.get("userId");
    const { allowed, retryAfter } = await checkRateLimit(
        c.env.RATE_LIMITER,
        `admin-mut:${userId}`,
        { windowMs: RATE_WINDOW_MS, maxRequests: RATE_MAX_MUTATIONS },
    );

    if (!allowed) {
        return c.json({ error: `Trop de requêtes. Réessayez dans ${retryAfter}s.` }, 429);
    }

    await next();
}

// ── Body size limiter ────────────────────────────────────────────────
const MAX_BODY_SIZE = 1_048_576; // 1 MB

export async function adminBodySizeLimiter(
    c: AdminCtx,
    next: Next,
): Promise<Response | void> {
    if (["POST", "PUT", "PATCH"].includes(c.req.method)) {
        const contentLength = c.req.header("content-length");
        if (contentLength !== undefined && contentLength !== null) {
            if (parseInt(contentLength, 10) > MAX_BODY_SIZE) {
                return c.json({ error: "Requête trop volumineuse." }, 413);
            }
        } else {
            // No Content-Length header: read a clone to measure actual size
            const body = await c.req.raw.clone().arrayBuffer();
            if (body.byteLength > MAX_BODY_SIZE) {
                return c.json({ error: "Requête trop volumineuse." }, 413);
            }
        }
    }
    await next();
}
