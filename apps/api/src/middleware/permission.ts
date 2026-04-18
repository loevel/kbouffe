import { createMiddleware } from "hono/factory";
import { hasPermission, type Permission } from "../lib/permissions";
import type { Env, Variables } from "../types";

/**
 * Requires that the authenticated user has the given permission.
 * Must be used after authMiddleware (which sets c.var.memberRole).
 *
 * Returns 403 if the role is missing or lacks the permission.
 */
export function requirePermission(permission: Permission) {
    return createMiddleware<{ Bindings: Env; Variables: Variables }>(async (c, next) => {
        const role = c.var.memberRole;
        if (!role || !hasPermission(role, permission)) {
            return c.json({ error: "Permission insuffisante", required: permission }, 403);
        }
        await next();
    });
}
