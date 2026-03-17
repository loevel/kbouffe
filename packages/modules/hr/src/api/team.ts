import { Hono } from "hono";
import { CoreEnv as Env, CoreVariables as Variables } from "@kbouffe/module-core";
import { hasPermission, canManageRole, ASSIGNABLE_ROLES, type TeamRole } from "./permissions";

export const teamRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * GET /team
 */
teamRoutes.get("/", async (c) => {
    try {
        const user = await c.var.supabase.auth.getUser();
        if (user.error || !user.data.user) {
            return c.json({ error: "Non authentifié" }, 401);
        }

        const supabase = c.var.supabase;

        // Find the caller's membership
        const { data: callerMembership, error: callerError } = await supabase
            .from("restaurant_members")
            .select("*")
            .eq("user_id", user.data.user.id)
            .eq("status", "active")
            .maybeSingle();

        if (callerError || !callerMembership) {
            return c.json({ error: "Aucune appartenance à un restaurant" }, 403);
        }

        if (!hasPermission(callerMembership.role as TeamRole, "team:read")) {
            return c.json({ error: "Permission refusée" }, 403);
        }

        // Get all members for this restaurant from Supabase
        const { data: membersRaw, error: membersError } = await supabase
            .from("restaurant_members")
            .select(`
                id,
                user_id,
                role,
                status,
                created_at,
                accepted_at,
                invited_by
            `)
            .eq("restaurant_id", callerMembership.restaurant_id);

        if (membersError) {
            return c.json({ error: membersError.message }, 500);
        }

        // Enrich with user info from Supabase
        const userIds = membersRaw.map(m => m.user_id);
        let membersWithUserInfo = membersRaw.map(m => ({
            id: m.id,
            userId: m.user_id,
            role: m.role,
            status: m.status,
            createdAt: m.created_at,
            acceptedAt: m.accepted_at,
            invitedBy: m.invited_by,
            email: "",
            fullName: null,
            avatarUrl: null,
            phone: null,
        }));

        if (userIds.length > 0) {
            const { data: supabaseUsers, error: usersError } = await supabase
                .from("users")
                .select("id, email, full_name, avatar_url, phone")
                .in("id", userIds);
            
            if (!usersError && supabaseUsers) {
                const userMap = new Map(supabaseUsers.map(u => [u.id, u]));
                membersWithUserInfo = membersRaw.map(m => {
                    const u = userMap.get(m.user_id);
                    return {
                        id: m.id,
                        userId: m.user_id,
                        role: m.role,
                        status: m.status,
                        createdAt: m.created_at,
                        acceptedAt: m.accepted_at,
                        invitedBy: m.invited_by,
                        email: u?.email || "",
                        fullName: u?.full_name || null,
                        avatarUrl: u?.avatar_url || null,
                        phone: u?.phone || null,
                    };
                });
            }
        }

        return c.json({ members: membersWithUserInfo, callerRole: callerMembership.role });
    } catch (error) {
        console.error("GET /team error:", error);
        return c.json({ error: "Erreur interne" }, 500);
    }
});

/**
 * POST /team/invite
 */
teamRoutes.post("/invite", async (c) => {
    try {
        const user = await c.var.supabase.auth.getUser();
        if (user.error || !user.data.user) {
            return c.json({ error: "Non authentifié" }, 401);
        }

        const body = await c.req.json().catch(() => ({})) as { email?: string; role?: string };
        const { email, role } = body;

        if (!email || !role) {
            return c.json({ error: "Email et rôle requis" }, 400);
        }

        if (!ASSIGNABLE_ROLES.includes(role as TeamRole)) {
            return c.json({ error: "Rôle invalide" }, 400);
        }

        const supabase = c.var.supabase;

        // Verify caller membership + permission
        const { data: callerMembership, error: callerError } = await supabase
            .from("restaurant_members")
            .select("*")
            .eq("user_id", user.data.user.id)
            .eq("status", "active")
            .maybeSingle();

        if (callerError || !callerMembership) {
            return c.json({ error: "Aucune appartenance" }, 403);
        }

        if (!hasPermission(callerMembership.role as TeamRole, "team:invite")) {
            return c.json({ error: "Permission refusée" }, 403);
        }

        // Cannot invite someone to a higher or equal role than yours (unless owner)
        if (!canManageRole(callerMembership.role as TeamRole, role as TeamRole)) {
            return c.json({ error: "Vous ne pouvez pas attribuer ce rôle" }, 403);
        }

        // Find the target user by email in Supabase
        const { data: targetUser, error: targetError } = await supabase
            .from("users")
            .select("id, email")
            .eq("email", email.toLowerCase().trim())
            .maybeSingle();

        if (targetError || !targetUser) {
            return c.json(
                { error: "Aucun utilisateur trouvé avec cet email. L'utilisateur doit d'abord créer un compte Kbouffe." },
                404
            );
        }

        // Check if already a member
        const { data: existing, error: existingError } = await supabase
            .from("restaurant_members")
            .select("*")
            .eq("restaurant_id", callerMembership.restaurant_id)
            .eq("user_id", targetUser.id)
            .maybeSingle();

        if (existing) {
            if (existing.status === "active") {
                return c.json({ error: "Cet utilisateur est déjà membre de votre restaurant" }, 409);
            }
            if (existing.status === "pending") {
                return c.json({ error: "Une invitation est déjà en attente pour cet utilisateur" }, 409);
            }
            // If revoked, re-invite by updating
            await supabase
                .from("restaurant_members")
                .update({ 
                    role, 
                    status: "pending", 
                    invited_by: user.data.user.id, 
                    created_at: new Date().toISOString(), 
                    accepted_at: null 
                })
                .eq("id", existing.id);

            return c.json({ success: true, reinvited: true });
        }

        // Create the membership (pending)
        const memberId = `mbr-${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;

        const { error: insertError } = await supabase
            .from("restaurant_members")
            .insert({
                id: memberId,
                restaurant_id: callerMembership.restaurant_id,
                user_id: targetUser.id,
                role,
                invited_by: user.data.user.id,
                status: "pending",
                created_at: new Date().toISOString(),
            });

        if (insertError) {
            return c.json({ error: insertError.message }, 500);
        }

        return c.json({ success: true, memberId });
    } catch (error) {
        console.error("POST /team/invite error:", error);
        return c.json({ error: "Erreur interne" }, 500);
    }
});

/**
 * POST /team/accept
 */
teamRoutes.post("/accept", async (c) => {
    try {
        const user = await c.var.supabase.auth.getUser();
        if (user.error || !user.data.user) {
            return c.json({ error: "Non authentifié" }, 401);
        }

        const body = await c.req.json().catch(() => ({})) as { memberId?: string };
        const { memberId } = body;

        if (!memberId) {
            return c.json({ error: "memberId requis" }, 400);
        }

        const supabase = c.var.supabase;

        // Find the pending membership for this user
        const { data: membership, error: membershipError } = await supabase
            .from("restaurant_members")
            .select("*")
            .eq("id", memberId)
            .eq("user_id", user.data.user.id)
            .eq("status", "pending")
            .maybeSingle();

        if (membershipError || !membership) {
            return c.json({ error: "Invitation introuvable ou déjà traitée" }, 404);
        }

        // Accept the invitation
        await supabase
            .from("restaurant_members")
            .update({ status: "active", accepted_at: new Date().toISOString() })
            .eq("id", memberId);

        // If role is driver, update the drivers table to link to this restaurant
        if (membership.role === "driver") {
            await supabase
                .from("drivers")
                .update({ restaurant_id: membership.restaurant_id })
                .eq("user_id", user.data.user.id);
        }

        return c.json({ success: true });
    } catch (error) {
        console.error("POST /team/accept error:", error);
        return c.json({ error: "Erreur interne" }, 500);
    }
});

/**
 * PATCH /team/:memberId
 */
teamRoutes.patch("/:memberId", async (c) => {
    try {
        const memberId = c.req.param("memberId");
        const user = await c.var.supabase.auth.getUser();
        if (user.error || !user.data.user) {
            return c.json({ error: "Non authentifié" }, 401);
        }

        const body = await c.req.json().catch(() => ({})) as { role?: string };
        const { role } = body;

        if (!role || !ASSIGNABLE_ROLES.includes(role as TeamRole)) {
            return c.json({ error: "Rôle invalide" }, 400);
        }

        const supabase = c.var.supabase;

        // Caller's membership
        const { data: callerMembership, error: callerError } = await supabase
            .from("restaurant_members")
            .select("*")
            .eq("user_id", user.data.user.id)
            .eq("status", "active")
            .maybeSingle();

        if (callerError || !callerMembership) {
            return c.json({ error: "Aucune appartenance" }, 403);
        }

        if (!hasPermission(callerMembership.role as TeamRole, "team:manage_roles")) {
            return c.json({ error: "Permission refusée. Seul le propriétaire peut changer les rôles." }, 403);
        }

        // Target membership
        const { data: target, error: targetError } = await supabase
            .from("restaurant_members")
            .select("*")
            .eq("id", memberId)
            .eq("restaurant_id", callerMembership.restaurant_id)
            .maybeSingle();

        if (targetError || !target) {
            return c.json({ error: "Membre introuvable" }, 404);
        }

        if (target.role === "owner") {
            return c.json({ error: "Impossible de modifier le rôle du propriétaire" }, 403);
        }

        if (!canManageRole(callerMembership.role as TeamRole, role as TeamRole)) {
            return c.json({ error: "Vous ne pouvez pas attribuer ce rôle" }, 403);
        }

        const oldRole = target.role;
        await supabase
            .from("restaurant_members")
            .update({ role })
            .eq("id", memberId);

        // Handle driver table sync
        if (role === "driver") {
            await supabase
                .from("drivers")
                .update({ restaurant_id: callerMembership.restaurant_id })
                .eq("user_id", target.user_id);
        } else if (oldRole === "driver") {
            // If they were a driver and now something else, unlink from restaurant
            await supabase
                .from("drivers")
                .update({ restaurant_id: null })
                .eq("user_id", target.user_id);
        }

        return c.json({ success: true });
    } catch (error) {
        console.error("PATCH /team/:memberId error:", error);
        return c.json({ error: "Erreur interne" }, 500);
    }
});

/**
 * DELETE /team/:memberId
 */
teamRoutes.delete("/:memberId", async (c) => {
    try {
        const memberId = c.req.param("memberId");
        const user = await c.var.supabase.auth.getUser();
        if (user.error || !user.data.user) {
            return c.json({ error: "Non authentifié" }, 401);
        }

        const supabase = c.var.supabase;

        // Caller's membership
        const { data: callerMembership, error: callerError } = await supabase
            .from("restaurant_members")
            .select("*")
            .eq("user_id", user.data.user.id)
            .eq("status", "active")
            .maybeSingle();

        if (callerError || !callerMembership) {
            return c.json({ error: "Aucune appartenance" }, 403);
        }

        if (!hasPermission(callerMembership.role as TeamRole, "team:invite")) {
            return c.json({ error: "Permission refusée" }, 403);
        }

        // Target membership
        const { data: target, error: targetError } = await supabase
            .from("restaurant_members")
            .select("*")
            .eq("id", memberId)
            .eq("restaurant_id", callerMembership.restaurant_id)
            .maybeSingle();

        if (targetError || !target) {
            return c.json({ error: "Membre introuvable" }, 404);
        }

        if (target.role === "owner") {
            return c.json({ error: "Impossible de révoquer le propriétaire" }, 403);
        }

        if (!canManageRole(callerMembership.role as TeamRole, target.role as TeamRole)) {
            return c.json({ error: "Vous ne pouvez pas révoquer ce membre" }, 403);
        }

        await supabase
            .from("restaurant_members")
            .update({ status: "revoked" })
            .eq("id", memberId);

        // If they were a driver, unlink from restaurant
        if (target.role === "driver") {
            await supabase
                .from("drivers")
                .update({ restaurant_id: null })
                .eq("user_id", target.user_id);
        }

        return c.json({ success: true });
    } catch (error) {
        console.error("DELETE /team/:memberId error:", error);
        return c.json({ error: "Erreur interne" }, 500);
    }
});

