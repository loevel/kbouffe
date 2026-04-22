import { Hono } from "hono";
import { z } from "zod";
import { requireDomain, logAdminAction } from "../../lib/admin-rbac";
import type { Env, Variables } from "../../types";
import { parseBody } from "../../lib/body";

export const restaurantsCrudRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

const LICENSE_TYPES = ["rccm", "niu", "sanitary", "municipal", "other"] as const;
const LICENSE_STATUSES = ["pending", "verified", "rejected", "expired"] as const;
const COMPLIANCE_STATUSES = ["pending", "in_review", "compliant", "blocked"] as const;

export const licenseUpsertSchema = z.object({
    license_type: z.enum(LICENSE_TYPES),
    license_number: z.string().trim().min(1, "Le numéro de licence est requis"),
    issuing_authority: z.string().trim().min(1, "L'autorité émettrice est requise"),
    status: z.enum(LICENSE_STATUSES).default("pending"),
    required_for_publication: z.boolean().default(true),
    evidence_url: z.string().trim().min(1).optional().nullable(),
    notes: z.string().trim().optional().nullable(),
    expires_at: z.string().datetime().optional().nullable(),
});

type RestaurantLicenseInput = z.infer<typeof licenseUpsertSchema>;

type ComplianceSnapshot = {
    kycStatus: string;
    complianceStatus: (typeof COMPLIANCE_STATUSES)[number];
    complianceBlockReason: string | null;
    canPublish: boolean;
    requiredLicenses: number;
    verifiedLicenses: number;
    licenses: Array<{
        id: string;
        licenseType: string;
        licenseNumber: string;
        issuingAuthority: string;
        status: string;
        requiredForPublication: boolean;
        evidenceUrl: string | null;
        notes: string | null;
        expiresAt: string | null;
        verifiedAt: string | null;
        verifiedBy: string | null;
        isExpired: boolean;
    }>;
};

export function mapLicenseRow(row: any) {
    const expiresAt = row.expires_at ?? null;
    const isExpired = Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now());

    return {
        id: row.id,
        licenseType: row.license_type,
        licenseNumber: row.license_number,
        issuingAuthority: row.issuing_authority,
        status: row.status,
        requiredForPublication: Boolean(row.required_for_publication),
        evidenceUrl: row.evidence_url ?? null,
        notes: row.notes ?? null,
        expiresAt,
        verifiedAt: row.verified_at ?? null,
        verifiedBy: row.verified_by ?? null,
        isExpired,
    };
}

export async function getComplianceSnapshot(
    supabase: any,
    restaurantId: string,
    options: { kycStatusOverride?: string } = {},
): Promise<ComplianceSnapshot> {
    const [restaurantRes, licensesRes] = await Promise.all([
        supabase.from("restaurants").select("id, kyc_status, compliance_status").eq("id", restaurantId).maybeSingle(),
        supabase
            .from("restaurant_licenses")
            .select("id, license_type, license_number, issuing_authority, status, required_for_publication, evidence_url, notes, verified_at, verified_by, expires_at")
            .eq("restaurant_id", restaurantId)
            .order("created_at", { ascending: true }),
    ]);

    const restaurant = restaurantRes.data;
    const kycStatus = options.kycStatusOverride ?? restaurant?.kyc_status ?? "pending";
    const licenses = (licensesRes.data ?? []).map(mapLicenseRow);
    const now = Date.now();

    const requiredLicenses = licenses.filter((license: RestaurantLicenseInput) => license.required_for_publication);
    const verifiedLicenses = requiredLicenses.filter(
        (license: RestaurantLicenseInput) => license.status === "verified" && (!license.expires_at || new Date(license.expires_at).getTime() > now),
    );

    let complianceStatus: (typeof COMPLIANCE_STATUSES)[number] = "pending";
    let complianceBlockReason: string | null = null;

    if (kycStatus === "rejected") {
        complianceStatus = "blocked";
        complianceBlockReason = "KYC rejeté";
    } else if (kycStatus === "approved" && requiredLicenses.length > 0 && verifiedLicenses.length === requiredLicenses.length) {
        complianceStatus = "compliant";
    } else if (kycStatus === "approved") {
        complianceStatus = "in_review";
        complianceBlockReason = requiredLicenses.length === 0
            ? "Aucune licence structurée enregistrée"
            : "Licences requises manquantes ou expirées";
    } else if (kycStatus === "documents_submitted" || kycStatus === "submitted" || kycStatus === "incomplete") {
        complianceStatus = "in_review";
        complianceBlockReason = "KYC en attente de validation";
    }

    return {
        kycStatus,
        complianceStatus,
        complianceBlockReason,
        canPublish: complianceStatus === "compliant",
        requiredLicenses: requiredLicenses.length,
        verifiedLicenses: verifiedLicenses.length,
        licenses,
    };
}

export async function persistComplianceSnapshot(supabase: any, restaurantId: string, snapshot?: ComplianceSnapshot) {
    const current = snapshot ?? (await getComplianceSnapshot(supabase, restaurantId));
    await supabase
        .from("restaurants")
        .update({
            compliance_status: current.complianceStatus,
            compliance_last_checked_at: new Date().toISOString(),
            compliance_block_reason: current.complianceBlockReason,
        })
        .eq("id", restaurantId);
    return current;
}

restaurantsCrudRoutes.get("/", async (c) => {
    const denied = requireDomain(c, "restaurants:read");
    if (denied) return denied;

    const q = c.req.query("q") ?? "";
    const statusFilter = c.req.query("status") ?? "all";
    const verifiedFilter = c.req.query("verified") ?? "all";
    const kycFilter = c.req.query("kyc") ?? c.req.query("kyc_status") ?? "all";
    const fromDate = c.req.query("from") ?? c.req.query("date_from") ?? "";
    const toDate = c.req.query("to") ?? c.req.query("date_to") ?? "";
    const page = Math.max(1, parseInt(c.req.query("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "20")));
    const sortField = c.req.query("sort") ?? "created_at";
    const sortOrder = c.req.query("order") ?? "desc";

    const supabase = c.var.supabase;
    
    let query = supabase
        .from("restaurants")
        .select("*", { count: "exact" });

    // Apply filters
    if (q) {
        query = query.or(
            `name.ilike.%${q}%,slug.ilike.%${q}%,city.ilike.%${q}%,cuisine_type.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`,
        );
    }
    if (statusFilter === "active") query = query.eq("is_published", true);
    if (statusFilter === "inactive" || statusFilter === "blocked") query = query.eq("is_published", false);
    if (verifiedFilter === "true") query = query.eq("is_verified", true);
    if (verifiedFilter === "false") query = query.eq("is_verified", false);
    if (kycFilter !== "all") query = query.eq("kyc_status", kycFilter);
    if (fromDate) query = query.gte("created_at", fromDate);
    if (toDate) query = query.lte("created_at", toDate + "T23:59:59.999Z");

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
        complianceStatus: r.compliance_status || "pending",
        complianceBlockReason: r.compliance_block_reason ?? null,
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

restaurantsCrudRoutes.get("/health-scores", async (c) => {
    const denied = requireDomain(c, "restaurants:read");
    if (denied) return denied;

    const supabase = c.var.supabase;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

    const { data: restaurants, error: restError } = await supabase
        .from("restaurants")
        .select("id, name")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(60);

    if (restError) {
        return c.json({ error: "Erreur lors du chargement des restaurants" }, 500);
    }

    const ids = (restaurants || []).map((r: any) => r.id);
    if (ids.length === 0) {
        return c.json({ data: [] });
    }

    // Bulk parallel queries to avoid N+1
    const [recentOrdersRes, prevOrdersRes, productUpdatesRes, openTicketsRes, packsRes] = await Promise.all([
        supabase.from("orders").select("restaurant_id").in("restaurant_id", ids).gte("created_at", thirtyDaysAgo).limit(5000),
        supabase.from("orders").select("restaurant_id").in("restaurant_id", ids).gte("created_at", sixtyDaysAgo).lt("created_at", thirtyDaysAgo).limit(5000),
        supabase.from("products").select("restaurant_id").in("restaurant_id", ids).gte("updated_at", thirtyDaysAgo).limit(5000),
        supabase.from("support_tickets").select("restaurant_id").eq("status", "open").in("restaurant_id", ids).limit(1000),
        supabase.from("marketplace_purchases").select("restaurant_id, amount_paid").eq("status", "active").in("restaurant_id", ids).limit(1000),
    ]);

    // Aggregate counts per restaurant
    const recentOrderCount: Record<string, number> = {};
    for (const o of recentOrdersRes.data ?? []) {
        recentOrderCount[(o as any).restaurant_id] = (recentOrderCount[(o as any).restaurant_id] ?? 0) + 1;
    }
    const prevOrderCount: Record<string, number> = {};
    for (const o of prevOrdersRes.data ?? []) {
        prevOrderCount[(o as any).restaurant_id] = (prevOrderCount[(o as any).restaurant_id] ?? 0) + 1;
    }
    const productUpdateCount: Record<string, number> = {};
    for (const p of productUpdatesRes.data ?? []) {
        productUpdateCount[(p as any).restaurant_id] = (productUpdateCount[(p as any).restaurant_id] ?? 0) + 1;
    }
    const openTicketCount: Record<string, number> = {};
    for (const t of openTicketsRes.data ?? []) {
        openTicketCount[(t as any).restaurant_id] = (openTicketCount[(t as any).restaurant_id] ?? 0) + 1;
    }
    const packRevenue: Record<string, number> = {};
    for (const p of packsRes.data ?? []) {
        packRevenue[(p as any).restaurant_id] = (packRevenue[(p as any).restaurant_id] ?? 0) + ((p as any).amount_paid ?? 0);
    }

    const data = (restaurants || []).map((restaurant: any) => {
        const activityOrders = recentOrderCount[restaurant.id] ?? 0;
        const prevOrders = prevOrderCount[restaurant.id] ?? 0;
        const productUpdates = productUpdateCount[restaurant.id] ?? 0;
        const openTickets = openTicketCount[restaurant.id] ?? 0;
        const boost = packRevenue[restaurant.id] ?? 0;

        // Activity score: 100 at >=15 orders, linear from 0
        const activityScore = Math.min(100, Math.round((activityOrders / 15) * 100));

        // Growth score: 50 baseline, ±5 per percentage point of growth
        const growthRate = prevOrders > 0
            ? Math.round(((activityOrders - prevOrders) / prevOrders) * 100)
            : activityOrders > 0 ? 20 : 0;
        const growthScore = Math.min(100, Math.max(0, 50 + growthRate * 5));

        // Engagement score: 100 if >=3 product updates, min 20
        const engagementScore = Math.min(100, Math.max(20, Math.round((productUpdates / 3) * 100)));

        // Support score: 100 with no open tickets, -20 per open ticket
        const supportScore = Math.max(0, 100 - openTickets * 20);

        // Boost adoption score: 100 if has active pack, 20 if none
        const boostScore = boost > 0 ? 100 : 20;

        const totalScore = Math.round(
            activityScore * 0.25 +
            growthScore * 0.25 +
            engagementScore * 0.20 +
            supportScore * 0.15 +
            boostScore * 0.15
        );

        const tier: "Healthy" | "At-Risk" | "Churning" =
            totalScore >= 70 ? "Healthy" : totalScore >= 40 ? "At-Risk" : "Churning";

        const recommendations: string[] = [];
        if (tier === "Healthy") {
            recommendations.push("🟢 Fidéliser : Proposer la mise à niveau Boost Pack ou des fonctionnalités premium");
        } else if (tier === "At-Risk") {
            recommendations.push("🟡 Intervention proactive requise : Planifier un appel de suivi cette semaine");
            if (activityScore < 50) recommendations.push("Activité en baisse : Envoyer email de formation + offre d'incentive");
            if (engagementScore < 50) recommendations.push("Peu de mises à jour du menu : Proposer un appel de formation menu");
        } else {
            recommendations.push("🔴 Campagne de reconquête urgente nécessaire");
            recommendations.push("Contacter le dirigeant + affecter un support dédié");
        }

        return {
            restaurant_id: restaurant.id,
            restaurant_name: restaurant.name,
            total_score: totalScore,
            tier,
            components: [
                { component: "Activity", weight: "25%", metric_value: activityOrders, score: activityScore, weighted_score: (activityScore * 0.25).toFixed(1) },
                { component: "Growth", weight: "25%", metric_value: growthRate, score: growthScore, weighted_score: (growthScore * 0.25).toFixed(1) },
                { component: "Engagement", weight: "20%", metric_value: productUpdates, score: engagementScore, weighted_score: (engagementScore * 0.20).toFixed(1) },
                { component: "Support", weight: "15%", metric_value: openTickets, score: supportScore, weighted_score: (supportScore * 0.15).toFixed(1) },
                { component: "Boost Adoption", weight: "15%", metric_value: boost, score: boostScore, weighted_score: (boostScore * 0.15).toFixed(1) },
            ],
            recommendations,
        };
    });

    return c.json({ data });
});

restaurantsCrudRoutes.get("/:id", async (c) => {
    const denied = requireDomain(c, "restaurants:read");
    if (denied) return denied;
    const id = c.req.param("id");
    
    // Fetch from Supabase (Source of Truth)
    const supabase = c.var.supabase;
    const [restaurantRes, licensesRes] = await Promise.all([
        supabase
            .from("restaurants")
            .select("*")
            .eq("id", id)
            .maybeSingle(),
        supabase
            .from("restaurant_licenses")
            .select("id, license_type, license_number, issuing_authority, status, required_for_publication, evidence_url, notes, verified_at, verified_by, expires_at, created_at, updated_at")
            .eq("restaurant_id", id)
            .order("created_at", { ascending: true }),
    ]);
    const { data: restaurant, error } = restaurantRes;

    if (error || !restaurant) return c.json({ error: "Restaurant introuvable" }, 404);
    const compliance = await getComplianceSnapshot(supabase, id);
    const licenses = (licensesRes.data ?? []).map(mapLicenseRow);

    // Compute live stats from source tables
    const [ordersResult, reviewsResult, favoritesResult] = await Promise.all([
        supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("restaurant_id", id)
            .not("status", "eq", "cancelled"),
        supabase
            .from("reviews")
            .select("rating")
            .eq("restaurant_id", id),
        supabase
            .from("restaurant_favorites")
            .select("id", { count: "exact", head: true })
            .eq("restaurant_id", id),
    ]);

    const orderCount = ordersResult.count ?? 0;
    const reviews = reviewsResult.data ?? [];
    const reviewCount = reviews.length;
    const rating = reviewCount > 0
        ? Math.round((reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviewCount) * 10) / 10
        : 0;
    const favoritesCount = favoritesResult.count ?? 0;

    // Fetch owner info
    let owner = null;
    if (restaurant.owner_id) {
        const { data: ownerData } = await supabase
            .from("users")
            .select("id, email, full_name, phone")
            .eq("id", restaurant.owner_id)
            .maybeSingle();
        if (ownerData) {
            owner = {
                id: ownerData.id,
                email: ownerData.email,
                fullName: ownerData.full_name,
                phone: ownerData.phone,
            };
        }
    }

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
        kycDocuments: {
            niu: Boolean(restaurant.kyc_niu_url),
            rccm: Boolean(restaurant.kyc_rccm_url),
            id: Boolean(restaurant.kyc_id_url),
        },
        kycRejectionReason: restaurant.kyc_rejection_reason,
        kycSubmittedAt: restaurant.kyc_submitted_at,
        complianceStatus: compliance.complianceStatus,
        complianceBlockReason: compliance.complianceBlockReason,
        canPublish: compliance.canPublish,
        requiredLicenses: compliance.requiredLicenses,
        verifiedLicenses: compliance.verifiedLicenses,
        licenses,
        cuisineType: restaurant.cuisine_type,
        rating,
        reviewCount,
        orderCount,
        favoritesCount,
        owner,
        createdAt: restaurant.created_at,
        updatedAt: restaurant.updated_at,
        lat: restaurant.lat,
        lng: restaurant.lng,
        priceRange: restaurant.price_range,
    });
});

restaurantsCrudRoutes.patch("/:id", async (c) => {
    const denied = requireDomain(c, "restaurants:write");
    if (denied) return denied;
    
    const id = c.req.param("id");
    const body = await parseBody(c);
    if (!body) return c.json({ error: "Corps de la requête invalide" }, 400);

    const supabase = c.var.supabase;
    const preflight = await getComplianceSnapshot(supabase, id, typeof body.kycStatus === "string" ? body.kycStatus : undefined);

    if ("isActive" in body && body.isActive === true && !preflight.canPublish) {
        return c.json({
            error: "Publication refusée : le dossier doit être approuvé et les licences requises doivent être vérifiées.",
            compliance: {
                status: preflight.complianceStatus,
                blockReason: preflight.complianceBlockReason,
            },
        }, 422);
    }

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

    const compliance = await persistComplianceSnapshot(supabase, id, await getComplianceSnapshot(supabase, id));

    await logAdminAction(c, { 
        action: "update_restaurant", 
        targetType: "restaurant", 
        targetId: id, 
        details: { ...updates, complianceStatus: compliance.complianceStatus }
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
        complianceStatus: compliance.complianceStatus,
        complianceBlockReason: compliance.complianceBlockReason,
        updatedAt: updated.updated_at
    });
});

restaurantsCrudRoutes.delete("/:id", async (c) => {
    const denied = requireDomain(c, "restaurants:write");
    if (denied) return denied;

    const id = c.req.param("id");
    const supabase = c.var.supabase;

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

restaurantsCrudRoutes.get("/:id/members", async (c) => {
    const denied = requireDomain(c, "restaurants:read");
    if (denied) return denied;

    const id = c.req.param("id");
    const supabase = c.var.supabase;

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

restaurantsCrudRoutes.patch("/:id/members/:memberId", async (c) => {
    const denied = requireDomain(c, "restaurants:write");
    if (denied) return denied;

    const { id, memberId } = c.req.param();
    const body = await parseBody(c);
    if (!body) return c.json({ error: "Corps de la requête invalide" }, 400);
    const { role, status } = body;

    const supabase = c.var.supabase;

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

restaurantsCrudRoutes.delete("/:id/members/:memberId", async (c) => {
    const denied = requireDomain(c, "restaurants:write");
    if (denied) return denied;

    const { id, memberId } = c.req.param();
    const supabase = c.var.supabase;

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

restaurantsCrudRoutes.get("/:id/modules", async (c) => {
    const denied = requireDomain(c, "restaurants:read");
    if (denied) return denied;

    const id = c.req.param("id");
    const supabase = c.var.supabase;

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

restaurantsCrudRoutes.patch("/:id/modules", async (c) => {
    const denied = requireDomain(c, "restaurants:write");
    if (denied) return denied;

    const id = c.req.param("id");
    const body = await parseBody<{ moduleId: string; isActive: boolean }>(c);
    if (!body) return c.json({ error: "Corps de la requête invalide" }, 400);
    const { moduleId, isActive } = body;

    if (!moduleId || typeof isActive !== "boolean") {
        return c.json({ error: "moduleId et isActive sont requis" }, 400);
    }

    const supabase = c.var.supabase;

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
