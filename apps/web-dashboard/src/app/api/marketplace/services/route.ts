import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/marketplace/services
 * Récupère tous les packs marketplace actifs
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const category = request.nextUrl.searchParams.get("category");

        let query = supabase
            .from("marketplace_services" as any)
            .select("*")
            .eq("is_active", true)
            .order("sort_order", { ascending: true });

        if (category && category !== "all") {
            query = query.eq("category", category);
        }

        const { data, error } = await query;

        if (error) {
            console.error("Error fetching marketplace packs:", error);
            return NextResponse.json(
                { error: "Impossible de charger les packs" },
                { status: 500 }
            );
        }

        // Ensure features is always an array
        const packs = (data || []).map((pack: any) => ({
            ...pack,
            features: Array.isArray(pack.features) ? pack.features : [],
        }));

        return NextResponse.json({ success: true, data: packs });
    } catch (error) {
        console.error("Marketplace packs API error:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}
