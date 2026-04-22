import { Hono } from "hono";
import { z } from "zod";
import { requireDomain, logAdminAction } from "../../lib/admin-rbac";
import type { Env, Variables } from "../../types";
import { parseBody } from "../../lib/body";
import { escapeIlike, normalizeSearchQuery } from "../../lib/search";

export const adminUsersRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

function maskEmail(email: string | null | undefined): string | null {
    if (!email) return null;
    const [localPart, domain] = email.split("@");
    if (!domain) return email;
    if (localPart.length <= 2) return `${localPart[0] ?? "*"}***@${domain}`;
    return `${localPart.slice(0, 2)}***@${domain}`;
}

function maskPhone(phone: string | null | undefined): string | null {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, "");
    if (!digits) return phone;
    if (digits.length <= 4) return "••••";
    return `${digits.slice(0, 3)}•••${digits.slice(-2)}`;
}

const createUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    fullName: z.string().optional(),
    phone: z.string().optional(),
    role: z.enum(["admin", "support", "merchant", "customer", "driver"]).default("customer"),
    adminRole: z.enum(["super_admin", "support", "sales", "moderator"]).optional(),
}).refine(data => {
    if (data.role === "admin" && !data.adminRole) return false;
    return true;
}, {
    message: "adminRole est requis quand le rôle est 'admin'",
    path: ["adminRole"]
});

adminUsersRoutes.post("/", async (c) => {
    const denied = requireDomain(c, "users:write");
    if (denied) return denied;

    const body = await parseBody(c);
    if (!body) return c.json({ error: "Corps de la requête invalide" }, 400);
    const result = createUserSchema.safeParse(body);

    if (!result.success) {
        return c.json({ error: result.error.issues[0].message }, 400);
    }

    const { email, password, fullName, phone, role, adminRole } = result.data;

    // 1. Create in Supabase Auth via Admin API
    const supabaseAdmin = c.var.supabase;
    
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { 
            full_name: fullName, 
            phone, 
            role: role || "customer" 
        }
    });

    if (authError) return c.json({ error: authError.message }, 400);

    // 2. Insert into Supabase public.users
    const dbUser = {
        id: authUser.user.id,
        email,
        full_name: fullName || null,
        phone: phone || null,
        role: role,
        admin_role: adminRole || null,
        preferred_lang: "fr",
        notifications_enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    const { error: dbError } = await supabaseAdmin
        .from("users")
        .insert(dbUser);

    if (dbError) {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        return c.json({ error: "Erreur enregistrement Supabase DB: " + dbError.message }, 500);
    }

    await logAdminAction(c, { 
        action: "create_user", 
        targetType: "user", 
        targetId: authUser.user.id, 
        details: { email: maskEmail(email), role, adminRole } 
    });

    return c.json({
        ...dbUser,
        email: maskEmail(email),
        emailRaw: email,
        phone: maskPhone(phone),
        phoneRaw: phone || null,
    }, 201);
});

adminUsersRoutes.get("/", async (c) => {
    const denied = requireDomain(c, "users:read");
    if (denied) return denied;

    const q = normalizeSearchQuery(c.req.query("q"));
    const roleFilter = c.req.query("role") ?? "all";
    const statusFilter = c.req.query("status") ?? "all";
    const fromDate = c.req.query("from") ?? c.req.query("date_from") ?? "";
    const toDate = c.req.query("to") ?? c.req.query("date_to") ?? "";
    const page = Math.max(1, parseInt(c.req.query("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "20")));
    const sortField = c.req.query("sort") ?? "created_at";
    const sortOrder = c.req.query("order") ?? "desc";

    const supabase = c.var.supabase;
    
    let query = supabase
        .from("users")
        .select("*", { count: "exact" });

    // Apply filters
    if (q) {
        const qs = escapeIlike(q);
        query = query.or(`email.ilike.%${qs}%,full_name.ilike.%${qs}%,phone.ilike.%${qs}%`);
    }
    if (roleFilter !== "all") {
        query = query.eq("role", roleFilter);
    }
    if (statusFilter === "active") {
        query = query.not("last_login_at", "is", null);
    } else if (statusFilter === "banned" || statusFilter === "inactive") {
        query = query.is("last_login_at", null);
    }
    if (fromDate) query = query.gte("created_at", fromDate);
    if (toDate) query = query.lte("created_at", toDate + "T23:59:59.999Z");

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
        email: maskEmail(u.email),
        emailRaw: u.email,
        fullName: u.full_name,
        phone: maskPhone(u.phone),
        phoneRaw: u.phone,
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
    const supabase = c.var.supabase;
    
    // Fetch user separately, then restaurant if needed
    const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error) {
        console.error("Admin GET user error:", error);
        return c.json({ error: "Erreur lors de la récupération de l'utilisateur" }, 500);
    }
    if (!user) return c.json({ error: "Utilisateur introuvable" }, 404);

    // Fetch restaurant separately if user has one
    let restaurant = null;
    if (user.restaurant_id) {
        const { data: rest } = await supabase
            .from("restaurants")
            .select("id, name, slug, city, is_published, is_verified")
            .eq("id", user.restaurant_id)
            .maybeSingle();
        if (rest) {
            restaurant = {
                id: rest.id,
                name: rest.name,
                slug: rest.slug,
                city: rest.city,
                isActive: rest.is_published,
                isVerified: rest.is_verified,
            };
        }
    }

    // Fetch driver info if applicable
    let driver = null;
    if (user.role === "driver" || user.role === "livreur") {
        const { data: driverData } = await supabase
            .from("drivers")
            .select("id, vehicle_type, status, is_verified, total_deliveries, rating")
            .eq("user_id", id)
            .maybeSingle();
        if (driverData) {
            driver = {
                id: driverData.id,
                vehicleType: driverData.vehicle_type,
                status: driverData.status,
                isVerified: driverData.is_verified,
                totalDeliveries: driverData.total_deliveries,
                rating: driverData.rating,
            };
        }
    }

    return c.json({
        id: user.id,
        email: maskEmail(user.email),
        emailRaw: user.email,
        fullName: user.full_name,
        phone: maskPhone(user.phone),
        phoneRaw: user.phone,
        avatarUrl: user.avatar_url,
        role: user.role,
        adminRole: user.admin_role,
        restaurantId: user.restaurant_id,
        restaurant,
        driver,
        preferredLang: user.preferred_lang,
        notificationsEnabled: user.notifications_enabled,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
    });
});

adminUsersRoutes.patch("/:id", async (c) => {
    const denied = requireDomain(c, "users:write");
    if (denied) return denied;
    const id = c.req.param("id");

    // Prevent editing own admin role (safety)
    if (id === c.get("userId")) return c.json({ error: "Impossible de modifier son propre compte admin" }, 400);

    const body = await parseBody(c);
    if (!body) return c.json({ error: "Corps de la requête invalide" }, 400);
    const updates: Record<string, any> = {
        updated_at: new Date().toISOString()
    };
    
    if ("role" in body) updates.role = body.role;
    if ("adminRole" in body) updates.admin_role = body.adminRole;
    if ("fullName" in body) updates.full_name = body.fullName;
    if ("phone" in body) updates.phone = body.phone;
    
    if (Object.keys(updates).length <= 1) return c.json({ error: "Aucun champ valide fourni" }, 400);

    const supabase = c.var.supabase;
    const { data: updated, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) return c.json({ error: error.message }, 500);

    await logAdminAction(c, {
        action: "update_user",
        targetType: "user",
        targetId: id,
        details: {
            ...updates,
            email: "email" in updates ? maskEmail(updates.email) : undefined,
            phone: "phone" in updates ? maskPhone(updates.phone) : undefined,
        },
    });

    return c.json({
        id: updated.id,
        email: maskEmail(updated.email),
        emailRaw: updated.email,
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

    const supabaseAdmin = c.var.supabase;

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

    const supabaseAdmin = c.var.supabase;

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

/** POST /admin/users/:id/impersonate — Generate a login link for support */
adminUsersRoutes.post("/:id/impersonate", async (c) => {
    const denied = requireDomain(c, "users:write");
    if (denied) return denied;
    const id = c.req.param("id");

    const supabaseAdmin = c.var.supabase;

    // Fetch user to ensure existence
    const { data: user, error: fetchError } = await supabaseAdmin
        .from("users")
        .select("email, role")
        .eq("id", id)
        .single();

    if (fetchError || !user) return c.json({ error: "Utilisateur introuvable" }, 404);

    // Super-Admin only can impersonate other Admins
    if (user.role === 'admin' && c.get("adminRole") !== 'super_admin') {
        return c.json({ error: "Seuls les Super-Admins peuvent impersonner d'autres Admins" }, 403);
    }

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: user.email,
        options: {
            redirectTo: c.env.DASHBOARD_URL || 'http://localhost:3000/dashboard'
        }
    });

    if (error) return c.json({ error: error.message }, 500);

    await logAdminAction(c, { 
        action: "impersonate_user", 
        targetType: "user", 
        targetId: id,
        details: { email: maskEmail(user.email) }
    });

    return c.json({ 
        success: true, 
        magicLink: data.properties.action_link,
        message: "Utilisez ce lien pour accéder au compte de l'utilisateur."
    });
});
