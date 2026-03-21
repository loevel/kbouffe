import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { requireDomain, logAdminAction } from "../../lib/admin-rbac";
import type { Env, Variables } from "../../types";

export const adminRestaurantsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

adminRestaurantsRoutes.get("/", async (c) => {
    const denied = requireDomain(c, "restaurants:read");
    if (denied) return denied;

    const q = c.req.query("q") ?? "";
    const statusFilter = c.req.query("status") ?? "all";
    const verifiedFilter = c.req.query("verified") ?? "all";
    const page = Math.max(1, parseInt(c.req.query("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "20")));
    const sortField = c.req.query("sort") ?? "created_at";
    const sortOrder = c.req.query("order") ?? "desc";

    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);
    
    let query = supabase
        .from("restaurants")
        .select("*", { count: "exact" });

    // Apply filters
    if (q) {
        query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%,city.ilike.%${q}%`);
    }
    if (statusFilter === "active") query = query.eq("is_published", true);
    if (statusFilter === "inactive") query = query.eq("is_published", false);
    if (verifiedFilter === "true") query = query.eq("is_verified", true);
    if (verifiedFilter === "false") query = query.eq("is_verified", false);

    // Apply sorting
    const supabaseSortField = sortField === "created" ? "created_at" : sortField;
    query = query.order(supabaseSortField, { ascending: sortOrder === "asc" });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: supabaseData, count: total, error } = await query;

    if (error) {
        return c.json({ error: error.message, data: [], pagination: { page, limit, total: 0, totalPages: 0 } }, 500);
    }

    // Map Supabase fields to frontend expected camelCase
    const formattedData = (supabaseData || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description,
        address: r.address,
        city: r.city,
        phone: r.phone,
        email: r.email,
        logoUrl: r.logo_url,
        bannerUrl: r.banner_url,
        isActive: !!r.is_published,
        isVerified: !!r.is_verified,
        isPremium: !!r.is_premium,
        isSponsored: !!r.is_sponsored,
        kycStatus: r.kyc_status || "pending",
        cuisineType: r.cuisine_type || "unknown",
        rating: Number(r.rating || 0),
        reviewCount: Number(r.review_count || 0),
        orderCount: Number(r.order_count || 0),
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        ownerId: r.owner_id,
    }));

    return c.json({ 
        data: formattedData, 
        pagination: { 
            page, 
            limit, 
            total: total ?? formattedData.length, 
            totalPages: Math.ceil((total ?? formattedData.length) / limit) 
        } 
    });
});

adminRestaurantsRoutes.get("/:id", async (c) => {
    const denied = requireDomain(c, "restaurants:read");
    if (denied) return denied;
    const id = c.req.param("id");
    
    // Fetch from Supabase (Source of Truth)
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);
    const { data: restaurant, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error || !restaurant) return c.json({ error: "Restaurant introuvable" }, 404);

    return c.json({
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        description: restaurant.description,
        address: restaurant.address,
        city: restaurant.city,
        phone: restaurant.phone,
        email: restaurant.email,
        logoUrl: restaurant.logo_url,
        bannerUrl: restaurant.banner_url,
        isActive: restaurant.is_published,
        isVerified: restaurant.is_verified,
        isPremium: restaurant.is_premium,
        isSponsored: restaurant.is_sponsored,
        kycStatus: restaurant.kyc_status,
        kycNiu: restaurant.kyc_niu,
        kycRccm: restaurant.kyc_rccm,
        kycNiuUrl: restaurant.kyc_niu_url,
        kycRccmUrl: restaurant.kyc_rccm_url,
        kycIdUrl: restaurant.kyc_id_url,
        kycRejectionReason: restaurant.kyc_rejection_reason,
        kycSubmittedAt: restaurant.kyc_submitted_at,
        cuisineType: restaurant.cuisine_type,
        rating: restaurant.rating,
        reviewCount: restaurant.review_count,
        orderCount: restaurant.order_count,
        createdAt: restaurant.created_at,
        updatedAt: restaurant.updated_at,
    });
});

adminRestaurantsRoutes.patch("/:id", async (c) => {
    const denied = requireDomain(c, "restaurants:write");
    if (denied) return denied;
    
    const id = c.req.param("id");
    const body = await c.req.json();

    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);

    // Map frontend fields (camelCase) to Supabase snake_case
    const updates: any = {
        updated_at: new Date().toISOString()
    };
    
    if ("isActive" in body) updates.is_published = body.isActive;
    if ("isVerified" in body) updates.is_verified = body.isVerified;
    if ("isPremium" in body) updates.is_premium = body.isPremium;
    if ("isSponsored" in body) updates.is_sponsored = body.isSponsored;
    if ("kycStatus" in body) updates.kyc_status = body.kycStatus;
    if ("kycRejectionReason" in body) updates.kyc_rejection_reason = body.kycRejectionReason;
    if ("cuisineType" in body) updates.cuisine_type = body.cuisineType;
    
    // Core info updates
    if ("name" in body) updates.name = body.name;
    if ("slug" in body) updates.slug = body.slug;
    if ("description" in body) updates.description = body.description;
    if ("address" in body) updates.address = body.address;
    if ("city" in body) updates.city = body.city;
    if ("phone" in body) updates.phone = body.phone;
    if ("email" in body) updates.email = body.email;
    if ("logoUrl" in body) updates.logo_url = body.logoUrl;
    if ("bannerUrl" in body) updates.banner_url = body.bannerUrl;
    if ("kycNiu" in body) updates.kyc_niu = body.kycNiu;
    if ("kycRccm" in body) updates.kyc_rccm = body.kycRccm;

    // Remove undefined fields
    Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

    if (Object.keys(updates).length <= 1) { // Only updated_at
        return c.json({ error: "Aucun champ valide fourni" }, 400);
    }

    const { data: updated, error } = await supabase
        .from("restaurants")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) return c.json({ error: error.message }, 500);

    await logAdminAction(c, { 
        action: "update_restaurant", 
        targetType: "restaurant", 
        targetId: id, 
        details: updates 
    });

    return c.json({
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        description: updated.description,
        address: updated.address,
        city: updated.city,
        phone: updated.phone,
        email: updated.email,
        logoUrl: updated.logo_url,
        bannerUrl: updated.banner_url,
        isActive: updated.is_published,
        isVerified: updated.is_verified,
        isPremium: updated.is_premium,
        isSponsored: updated.is_sponsored,
        kycStatus: updated.kyc_status,
        cuisineType: updated.cuisine_type,
        kycNiu: updated.kyc_niu,
        kycRccm: updated.kyc_rccm,
        updatedAt: updated.updated_at
    });
});

adminRestaurantsRoutes.delete("/:id", async (c) => {
    const denied = requireDomain(c, "restaurants:write");
    if (denied) return denied;

    const id = c.req.param("id");
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);

    // Get restaurant info for logging before deletion
    const { data: restaurant } = await supabase
        .from("restaurants")
        .select("name")
        .eq("id", id)
        .single();

    const { error } = await supabase
        .from("restaurants")
        .delete()
        .eq("id", id);

    if (error) return c.json({ error: error.message }, 500);

    await logAdminAction(c, {
        action: "delete_restaurant",
        targetType: "restaurant",
        targetId: id,
        details: { name: restaurant?.name }
    });

    return c.json({ success: true });
});

// ── Restaurant Team Management ────────────────────────────────────

adminRestaurantsRoutes.get("/:id/members", async (c) => {
    const denied = requireDomain(c, "restaurants:read");
    if (denied) return denied;

    const id = c.req.param("id");
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);

    // Get all members for this restaurant
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
        .eq("restaurant_id", id);

    if (membersError) return c.json({ error: membersError.message }, 500);

    // Enrich with user info
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
    }));

    if (userIds.length > 0) {
        const { data: supabaseUsers } = await supabase
            .from("users")
            .select("id, email, full_name, avatar_url")
            .in("id", userIds);
        
        if (supabaseUsers) {
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
                };
            });
        }
    }

    return c.json({ members: membersWithUserInfo });
});

adminRestaurantsRoutes.patch("/:id/members/:memberId", async (c) => {
    const denied = requireDomain(c, "restaurants:write");
    if (denied) return denied;

    const { id, memberId } = c.req.param();
    const body = await c.req.json();
    const { role, status } = body;

    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);

    const updates: any = { updated_at: new Date().toISOString() };
    if (role) updates.role = role;
    if (status) updates.status = status;

    const { data: updated, error } = await supabase
        .from("restaurant_members")
        .update(updates)
        .eq("id", memberId)
        .eq("restaurant_id", id)
        .select()
        .single();

    if (error) return c.json({ error: error.message }, 500);

    await logAdminAction(c, {
        action: "update_member",
        targetType: "restaurant_member",
        targetId: memberId,
        details: { restaurantId: id, ...updates }
    });

    return c.json({ success: true, member: updated });
});

adminRestaurantsRoutes.delete("/:id/members/:memberId", async (c) => {
    const denied = requireDomain(c, "restaurants:write");
    if (denied) return denied;

    const { id, memberId } = c.req.param();
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);

    const { error } = await supabase
        .from("restaurant_members")
        .update({ status: "revoked", updated_at: new Date().toISOString() })
        .eq("id", memberId)
        .eq("restaurant_id", id);

    if (error) return c.json({ error: error.message }, 500);

    await logAdminAction(c, {
        action: "revoke_member",
        targetType: "restaurant_member",
        targetId: memberId,
        details: { restaurantId: id }
    });

    return c.json({ success: true });
});

// ─── Modules ──────────────────────────────────────────────────────────────────

const MODULE_CATALOG = [
    { id: "reservations", name: "Réservations", description: "Gestion des réservations de tables et zones.", icon: "CalendarDays" },
    { id: "marketing",    name: "Marketing",    description: "Campagnes, coupons et publicités SMS/MTN.", icon: "Megaphone" },
    { id: "hr",           name: "Équipe (RH)",  description: "Gestion des membres, rôles et permissions.", icon: "Users" },
    { id: "delivery",     name: "Livraison",    description: "Zones de livraison et suivi des commandes.", icon: "Truck" },
    { id: "dine_in",      name: "Sur place",    description: "Commandes sur place et gestion de salle.", icon: "Utensils" },
];

adminRestaurantsRoutes.get("/:id/modules", async (c) => {
    const denied = requireDomain(c, "restaurants:read");
    if (denied) return denied;

    const id = c.req.param("id");
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);

    const { data: rows, error } = await supabase
        .from("restaurant_modules")
        .select("module_id, is_active")
        .eq("restaurant_id", id);

    if (error) return c.json({ error: error.message }, 500);

    const activeMap = new Map((rows ?? []).map((r: any) => [r.module_id, r.is_active]));

    const modules = MODULE_CATALOG.map((m) => ({
        ...m,
        isActive: activeMap.has(m.id) ? !!activeMap.get(m.id) : false,
    }));

    return c.json({ modules });
});

adminRestaurantsRoutes.patch("/:id/modules", async (c) => {
    const denied = requireDomain(c, "restaurants:write");
    if (denied) return denied;

    const id = c.req.param("id");
    const { moduleId, isActive } = await c.req.json<{ moduleId: string; isActive: boolean }>();

    if (!moduleId || typeof isActive !== "boolean") {
        return c.json({ error: "moduleId et isActive sont requis" }, 400);
    }

    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY as string);

    const { error } = await supabase
        .from("restaurant_modules")
        .upsert(
            { restaurant_id: id, module_id: moduleId, is_active: isActive, updated_at: new Date().toISOString() },
            { onConflict: "restaurant_id,module_id" }
        );

    if (error) return c.json({ error: error.message }, 500);

    await logAdminAction(c, {
        action: isActive ? "enable_module" : "disable_module",
        targetType: "restaurant",
        targetId: id,
        details: { moduleId, isActive },
    });

    return c.json({ success: true });
});

