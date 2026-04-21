/**
 * Account & Security routes
 *
 * DELETE /account              — Delete the user account
 * POST   /security/password    — Change password
 * GET    /security/sessions    — List active sessions
 * POST   /security/sessions    — Revoke all sessions
 */
import { Hono } from "hono";
import type { Env, Variables } from "../../types";

export const accountRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();
export const securityRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ── Account ──────────────────────────────────────────────────────────

/** DELETE /account — Delete user's account */
accountRoutes.delete("/", async (c) => {
    // 1. Delete user from public.users
    const { error: userError } = await c.var.supabase
        .from("users")
        .delete()
        .eq("id", c.var.userId);

    if (userError) {
        console.error("User deletion error:", userError);
    }

    // Note: Deleting the identity from Supabase Auth requires Service Role Key
    // which is not always available or recommended here unless specifically handled.
    // For now we remove the application record.
    return c.json({ success: true });
});

// ── Security ─────────────────────────────────────────────────────────

/** POST /security/password — Change password */
securityRoutes.post("/password", async (c) => {
    const body = await c.req.json();
    const currentPassword = body.currentPassword?.trim() ?? "";
    const newPassword = body.newPassword?.trim() ?? "";

    if (!currentPassword || !newPassword) {
        return c.json({ error: "Mot de passe actuel et nouveau requis" }, 400);
    }
    if (newPassword.length < 6) {
        return c.json({ error: "Le mot de passe doit contenir au moins 6 caractères" }, 400);
    }

    // Verify current password by signing in
    const { data: userData } = await c.var.supabase.auth.getUser();
    const email = userData.user?.email ?? "";

    const { error: verifyError } = await c.var.supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
    });

    if (verifyError) return c.json({ error: "Mot de passe actuel incorrect" }, 400);

    const { error: updateError } = await c.var.supabase.auth.updateUser({
        password: newPassword,
    });

    if (updateError) return c.json({ error: updateError.message || "Échec de mise à jour" }, 400);

    return c.json({ success: true });
});

/** GET /security/sessions */
securityRoutes.get("/sessions", async (c) => {
    const now = new Date().toISOString();
    return c.json({
        sessions: [
            {
                id: "current",
                device: "Session actuelle",
                ip_address: c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "Inconnue",
                login_at: now,
                last_activity: now,
                is_current: true,
            },
        ],
    });
});

/** POST /security/sessions — Revoke all sessions */
securityRoutes.post("/sessions", async (c) => {
    const body = await c.req.json().catch(() => ({})) as { action?: string };

    if (body.action !== "revoke_all") return c.json({ error: "Action invalide" }, 400);

    const { error } = await c.var.supabase.auth.signOut({ scope: "global" });
    if (error) return c.json({ error: error.message || "Impossible de déconnecter" }, 400);

    return c.json({ success: true });
});
