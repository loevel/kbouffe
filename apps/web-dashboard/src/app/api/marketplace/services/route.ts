import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/marketplace/services
 * Récupère tous les services marketplace actifs
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const category = request.nextUrl.searchParams.get("category");

        let query = supabase
            .from("marketplace_services")
            .select("*")
            .eq("is_active", true)
            .order("sort_order", { ascending: true });

        if (category && category !== "all") {
            query = query.eq("category", category);
        }

        const { data, error } = await query;

        if (error) {
            console.error("Error fetching marketplace services:", error);
            return NextResponse.json(
                { error: "Impossible de charger les services" },
                { status: 500 }
            );
        }

        // Transform features from JSONB array to string array if needed
        const services = (data || []).map((service: any) => ({
            ...service,
            features: Array.isArray(service.features) ? service.features : [],
        }));

        return NextResponse.json({ data: services });
    } catch (error) {
        console.error("Marketplace services API error:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}
