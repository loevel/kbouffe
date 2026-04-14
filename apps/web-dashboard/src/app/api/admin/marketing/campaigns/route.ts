/**
 * GET  /api/admin/marketing/campaigns — List all campaigns (admin view)
 * POST /api/admin/marketing/campaigns — Create a new campaign (admin)
 */
import { NextRequest, NextResponse } from "next/server";
import { withAdmin, apiError } from "@/lib/api/helpers";

function serviceDb() {
    return require("@supabase/supabase-js").createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
}

export async function GET(request: NextRequest) {
    const auth = await withAdmin();
    if (auth.error) return auth.error;

    const db = serviceDb() as any;
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
    const offset = (page - 1) * limit;
    const statusFilter = searchParams.get("status");
    const typeFilter = searchParams.get("type");
    const restaurantSearch = searchParams.get("restaurant");

    let query = db
        .from("marketing_campaigns")
        .select(
            `id, restaurant_id, restaurants(id, name, slug),
            name, type, target_audience, budget, spend,
            reach, impressions, clicks, ctr, conversions,
            content, cta_url, status, starts_at, ends_at, created_at`,
            { count: "exact" }
        );

    if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
    }

    if (typeFilter && typeFilter !== "all") {
        query = query.eq("type", typeFilter);
    }

    if (restaurantSearch?.trim()) {
        query = query.ilike("restaurants.name", `%${restaurantSearch.trim()}%`);
    }

    const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error("[GET /api/admin/marketing/campaigns]", error);
        return apiError("Erreur lors du chargement des campagnes");
    }

    const campaigns = (data ?? []).map((row: any) => ({
        id: row.id,
        restaurantId: row.restaurant_id,
        restaurantName: row.restaurants?.name ?? null,
        restaurantSlug: row.restaurants?.slug ?? null,
        name: row.name,
        type: row.type,
        targetAudience: row.target_audience,
        budget: row.budget,
        spend: row.spend ?? 0,
        reach: row.reach ?? 0,
        impressions: row.impressions ?? 0,
        clicks: row.clicks ?? 0,
        ctr: row.ctr ?? 0,
        conversions: row.conversions ?? 0,
        content: row.content,
        ctaUrl: row.cta_url,
        status: row.status,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        createdAt: row.created_at,
    }));

    return NextResponse.json({
        data: campaigns,
        pagination: {
            page,
            limit,
            total: count ?? 0,
            totalPages: Math.ceil((count ?? 0) / limit),
        },
    });
}

export async function POST(request: NextRequest) {
    const auth = await withAdmin();
    if (auth.error) return auth.error;
    const { userId } = auth.ctx;

    const db = serviceDb() as any;

    let body: any;
    try {
        body = await request.json();
    } catch {
        return apiError("Body JSON invalide", 400);
    }

    const {
        restaurant_id,
        name,
        type,
        target_audience,
        budget,
        start_date,
        end_date,
        content,
        cta_url,
    } = body;

    // Validation
    if (!restaurant_id?.trim()) {
        return apiError("Restaurant ID requis", 400);
    }
    if (!name?.trim()) {
        return apiError("Nom de la campagne requis", 400);
    }
    if (!["sms", "push", "banner", "email"].includes(type)) {
        return apiError("Type de campagne invalide", 400);
    }
    if (!["all", "customers", "inactive", "new"].includes(target_audience)) {
        return apiError("Audience cible invalide", 400);
    }
    if (!start_date || !end_date) {
        return apiError("Dates de début et fin requises", 400);
    }
    if (new Date(end_date) <= new Date(start_date)) {
        return apiError("La date de fin doit être après la date de début", 400);
    }
    if (!content?.trim()) {
        return apiError("Contenu de la campagne requis", 400);
    }

    const budgetNum = parseInt(budget, 10);
    if (!Number.isFinite(budgetNum) || budgetNum <= 0) {
        return apiError("Budget invalide", 400);
    }

    // Check restaurant exists
    const { data: restaurant, error: restaurantError } = await db
        .from("restaurants")
        .select("id, name")
        .eq("id", restaurant_id)
        .single();

    if (restaurantError || !restaurant) {
        return apiError("Restaurant non trouvé", 404);
    }

    // Create campaign
    const campaignId = crypto.randomUUID();
    const { error: insertError } = await db
        .from("marketing_campaigns")
        .insert({
            id: campaignId,
            restaurant_id,
            name: name.trim(),
            type,
            target_audience,
            budget: budgetNum,
            spend: 0,
            reach: 0,
            impressions: 0,
            clicks: 0,
            ctr: 0,
            conversions: 0,
            content: content.trim(),
            cta_url: cta_url?.trim() || null,
            status: "pending",
            starts_at: new Date(start_date).toISOString(),
            ends_at: new Date(end_date).toISOString(),
            created_at: new Date().toISOString(),
        });

    if (insertError) {
        console.error("[POST /api/admin/marketing/campaigns]", insertError);
        return apiError("Erreur lors de la création de la campagne");
    }

    return NextResponse.json(
        {
            success: true,
            campaign: {
                id: campaignId,
                restaurantId: restaurant_id,
                restaurantName: restaurant.name,
                name: name.trim(),
                status: "pending",
            },
        },
        { status: 201 }
    );
}
