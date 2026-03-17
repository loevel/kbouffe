import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { requireDomain, logAdminAction } from "../../lib/admin-rbac";
import type { Env, Variables } from "../../types";

export const adminUsersRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

adminUsersRoutes.post("/", async (c) => {
    const denied = requireDomain(c, "users:write");
    if (denied) return denied;

    const body = await c.req.json();
    const { email, password, fullName, phone, role, adminRole } = body;

    if (!email || !password) return c.json({ error: "Email et mot de passe requis" }, 400);

    // 1. Create in Supabase Auth via Admin API
    if (!c.env.SUPABASE_SERVICE_ROLE_KEY) {
        return c.json({ error: "Configuration admin manquante (Service Role Key)" }, 500);
    }

    const supabaseAdmin = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
    
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { 
            full_name: fullName, 
            phone, 
            role: role || "client" 
        }
    });

    if (authError) return c.json({ error: authError.message }, 400);

    // 2. Insert into Supabase public.users
    const newUser = {
        id: authUser.user.id,
        email,
        full_name: fullName || null,
        phone: phone || null,
        role: role || "client",
        // admin_role is not standard in public.users but might be needed
        preferred_lang: "fr",
        notifications_enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    const { error: dbError } = await supabaseAdmin
        .from("users")
        .insert(newUser);

    if (dbError) {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        return c.json({ error: "Erreur enregistrement Supabase DB: " + dbError.message }, 500);
    }

    await logAdminAction(c, { 
        action: "create_user", 
        targetType: "user", 
        targetId: authUser.user.id, 
        details: { email, role, adminRole } 
    });

    return c.json(newUser, 201);
});

adminUsersRoutes.get("/", async (c) => {
    const denied = requireDomain(c, "users:read");
    if (denied) return denied;

    const q = c.req.query("q") ?? "";
    const roleFilter = c.req.query("role") ?? "all";
    const page = Math.max(1, parseInt(c.req.query("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "20")));
    const sortField = c.req.query("sort") ?? "created_at";
    const sortOrder = c.req.query("order") ?? "desc";

    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);
    
    let query = supabase
        .from("users")
        .select("*", { count: "exact" });

    // Apply filters
    if (q) {
        query = query.or(`email.ilike.%${q}%,full_name.ilike.%${q}%,phone.ilike.%${q}%`);
    }
    if (roleFilter !== "all") {
        query = query.eq("role", roleFilter);
    }

    // Apply sorting
    const supabaseSortField = sortField === "name" ? "full_name" : (sortField === "created" ? "created_at" : sortField);
    query = query.order(supabaseSortField, { ascending: sortOrder === "asc" });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: supabaseData, count: total, error } = await query;

    if (error) {
        console.error("Supabase Users Fetch Error:", error);
        return c.json({ data: [], pagination: { page, limit, total: 0, totalPages: 0 } });
    }

    // Map Supabase fields to frontend expected camelCase
    const formattedData = supabaseData.map((u: any) => ({
        id: u.id,
        email: u.email,
        fullName: u.full_name,
        phone: u.phone,
        avatarUrl: u.avatar_url,
        role: u.role,
        adminRole: u.admin_role,
        restaurantId: u.restaurant_id,
        preferredLang: u.preferred_lang,
        notificationsEnabled: u.notifications_enabled,
        onboardingCompleted: u.onboarding_completed,
        createdAt: u.created_at,
        lastLoginAt: u.last_login_at,
    }));

    return c.json({ 
        data: formattedData, 
        pagination: { 
            page, 
            limit, 
            total: total ?? 0, 
            totalPages: Math.ceil((total ?? 0) / limit) 
        } 
    });
});

adminUsersRoutes.get("/:id", async (c) => {
    const denied = requireDomain(c, "users:read");
    if (denied) return denied;
    const id = c.req.param("id");
    
    // Fetch from Supabase (Source of Truth)
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);
    const { data: user, error } = await supabase
        .from("users")
        .select(`
            *,
            restaurant:restaurants(*)
        `)
        .eq("id", id)
        .maybeSingle();

    if (error || !user) return c.json({ error: "Utilisateur introuvable" }, 404);

    return c.json({
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        avatarUrl: user.avatar_url,
        role: user.role,
        adminRole: user.admin_role,
        restaurantId: user.restaurant_id,
        restaurant: user.restaurant ? {
            id: user.restaurant.id,
            name: user.restaurant.name,
            slug: user.restaurant.slug,
            city: user.restaurant.city,
            isActive: user.restaurant.is_published,
            isVerified: user.restaurant.is_verified
        } : null,
        preferredLang: user.preferred_lang,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        lastLoginAt: user.last_login_at
    });
});

adminUsersRoutes.patch("/:id", async (c) => {
    const denied = requireDomain(c, "users:write");
    if (denied) return denied;
    const id = c.req.param("id");

    // Prevent editing own admin role (safety)
    if (id === c.get("userId")) return c.json({ error: "Impossible de modifier son propre compte admin" }, 400);

    const body = await c.req.json();
    const updates: Record<string, any> = {
        updated_at: new Date().toISOString()
    };
    
    if ("role" in body) updates.role = body.role;
    if ("adminRole" in body) updates.admin_role = body.adminRole;
    if ("fullName" in body) updates.full_name = body.fullName;
    if ("phone" in body) updates.phone = body.phone;
    
    if (Object.keys(updates).length <= 1) return c.json({ error: "Aucun champ valide fourni" }, 400);

    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);
    const { data: updated, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) return c.json({ error: error.message }, 500);

    await logAdminAction(c, { action: "update_user", targetType: "user", targetId: id, details: updates });

    return c.json({
        id: updated.id,
        email: updated.email,
        fullName: updated.full_name,
        role: updated.role,
        adminRole: updated.admin_role,
        updatedAt: updated.updated_at
    });
});

adminUsersRoutes.delete("/:id", async (c) => {
    const denied = requireDomain(c, "users:write");
    if (denied) return denied;
    const id = c.req.param("id");

    if (id === c.get("userId")) return c.json({ error: "Impossible de supprimer son propre compte admin" }, 400);

    const supabaseAdmin = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);

    // 1. Delete from Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authError) return c.json({ error: "Erreur Supabase Auth: " + authError.message }, 500);

    // 2. Delete from public.users (usually handled by trigger/cascade if DB is set up correctly, but let's be explicit if needed)
    // Actually, in many Supabase setups, auth.users deletion cascades to public.users if the FK is set with ON DELETE CASCADE.
    const { error: dbError } = await supabaseAdmin
        .from("users")
        .delete()
        .eq("id", id);

    if (dbError) {
        console.warn("DB Delete error (might be already deleted by cascade):", dbError.message);
    }

    await logAdminAction(c, { action: "delete_user", targetType: "user", targetId: id });

    return c.json({ success: true });
});

adminUsersRoutes.post("/:id/reset-password", async (c) => {
    const denied = requireDomain(c, "users:write");
    if (denied) return denied;
    const id = c.req.param("id");

    const supabaseAdmin = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);

    // Get user email first
    const { data: user, error: fetchError } = await supabaseAdmin
        .from("users")
        .select("email")
        .eq("id", id)
        .single();

    if (fetchError || !user) return c.json({ error: "Utilisateur introuvable" }, 404);

    const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: user.email,
    });

    if (resetError) return c.json({ error: resetError.message }, 500);

    // Alternatively, just send the email directly
    // const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(user.email);

    await logAdminAction(c, { action: "reset_password_request", targetType: "user", targetId: id });

    return c.json({ success: true, message: "Lien de récupération généré. L'utilisateur recevra un email si configuré, ou vous pouvez gérer les liens manuellement." });
});
