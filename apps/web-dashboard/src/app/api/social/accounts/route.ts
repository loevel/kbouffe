/**
 * GET  /api/social/accounts — list connected social accounts
 * POST /api/social/accounts — connect / update a social account
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

export async function GET() {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { supabase, restaurantId } = auth.ctx;

    const { data, error } = await supabase
        .from("social_accounts")
        .select("id, platform, account_name, is_connected, connected_at, page_id, chat_id, created_at")
        .eq("restaurant_id", restaurantId)
        .order("platform");

    if (error) {
        console.error("[GET /api/social/accounts]", error);
        return apiError("Erreur lors du chargement des comptes sociaux");
    }

    return NextResponse.json({ accounts: data ?? [] });
}

export async function POST(request: NextRequest) {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { supabase, restaurantId } = auth.ctx;

    try {
        const body = await request.json();
        const { platform, account_name, access_token, refresh_token, page_id, chat_id } = body;

        if (!platform || !["facebook", "instagram", "tiktok", "telegram", "whatsapp"].includes(platform)) {
            return apiError("Plateforme invalide", 400);
        }

        // Upsert — one account per platform per restaurant
        const { data, error } = await supabase
            .from("social_accounts")
            .upsert(
                {
                    restaurant_id: restaurantId,
                    platform,
                    account_name: account_name || null,
                    access_token: access_token || null,
                    refresh_token: refresh_token || null,
                    page_id: page_id || null,
                    chat_id: chat_id || null,
                    is_connected: true,
                    connected_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                } as any,
                { onConflict: "restaurant_id,platform" }
            )
            .select("id, platform, account_name, is_connected, connected_at")
            .single();

        if (error) {
            console.error("[POST /api/social/accounts]", error);
            return apiError("Erreur lors de la connexion du compte");
        }

        return NextResponse.json({ account: data }, { status: 201 });
    } catch (err) {
        console.error("[POST /api/social/accounts] Unexpected:", err);
        return apiError("Erreur serveur");
    }
}
