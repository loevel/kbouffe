/**
 * Notifications routes
 *
 * GET  /notifications/preferences — Get notification settings
 * POST /notifications/preferences — Update notification settings
 */
import { Hono } from "hono";
import type { Env, Variables } from "../../types";

type NotificationChannel = { email: boolean; push: boolean };

export const notificationsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/** GET /notifications/preferences */
notificationsRoutes.get("/preferences", async (c) => {
    const { data: dbUser } = await c.var.supabase
        .from("users")
        .select("notifications_enabled")
        .eq("id", c.var.userId)
        .maybeSingle();

    return c.json({
        preferences: { notificationsEnabled: dbUser?.notifications_enabled ?? true },
    });
});

/** POST /notifications/preferences */
notificationsRoutes.post("/preferences", async (c) => {
    const body = await c.req.json();

    if (body.soundEnabled !== undefined && typeof body.soundEnabled !== "boolean") {
        return c.json({ error: "Champ soundEnabled invalide" }, 400);
    }

    if (body.settings !== undefined) {
        const valid = body.settings && typeof body.settings === "object" &&
            Object.values(body.settings).every(
                (ch: any) => ch && typeof ch === "object" && typeof ch.email === "boolean" && typeof ch.push === "boolean",
            );
        if (!valid) return c.json({ error: "Format settings invalide" }, 400);
    }

    const settings = (body.settings ?? {}) as Record<string, NotificationChannel>;
    const notificationsEnabled = Object.values(settings).some((ch) => ch.email || ch.push);

    await c.var.supabase
        .from("users")
        .update({ 
            notifications_enabled: notificationsEnabled, 
            updated_at: new Date().toISOString() 
        })
        .eq("id", c.var.userId);

    return c.json({
        success: true,
        preferences: {
            settings,
            soundEnabled: body.soundEnabled ?? true,
            notificationsEnabled,
        },
    });
});
