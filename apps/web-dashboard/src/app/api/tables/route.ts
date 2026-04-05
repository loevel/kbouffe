import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

/**
 * GET /api/tables
 * Get all tables and zones for the restaurant
 */
export async function GET(request: NextRequest) {
    const { ctx, error } = await withAuth();
    if (error) return error;

    try {
        // Fetch tables with zone information
        const { data: tables, error: tablesError } = await ctx.supabase
            .from("restaurant_tables")
            .select(
                "id, number, zone_id, capacity, status, qr_code, is_active, sort_order, table_zones:zone_id(name, type)"
            )
            .eq("restaurant_id", ctx.restaurantId)
            .order("sort_order", { ascending: true });

        if (tablesError) {
            console.error("Error fetching tables:", tablesError);
            return apiError("Erreur lors de la récupération des tables");
        }

        // Fetch zones
        const { data: zones, error: zonesError } = await ctx.supabase
            .from("table_zones")
            .select("id, name, type, description, sort_order, is_active, image_url, image_urls, color, capacity, min_party_size, amenities, pricing_note")
            .eq("restaurant_id", ctx.restaurantId)
            .order("sort_order", { ascending: true });

        if (zonesError) {
            console.error("Error fetching zones:", zonesError);
            return apiError("Erreur lors de la récupération des zones");
        }

        return NextResponse.json({
            tables: tables || [],
            zones: zones || [],
        });
    } catch (err) {
        console.error("GET /api/tables error:", err);
        return apiError("Erreur interne");
    }
}
