import { NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

/**
 * POST /api/zones
 * Creates a new table zone.
 */
export async function POST(req: Request) {
    const { ctx, error } = await withAuth();
    if (error) return error;

    try {
        const body = await req.json();
        const { name, type } = body;

        if (!name?.trim()) {
            return apiError("Le nom de la zone est requis", 400);
        }

        const { data: zone, error: insertError } = await ctx.supabase
            .from("table_zones")
            .insert({
                restaurant_id: ctx.restaurantId,
                name: name.trim(),
                type: type || "indoor",
            })
            .select()
            .single();

        if (insertError) {
            console.error("Error creating zone:", insertError);
            return apiError("Erreur lors de la création de la zone");
        }

        return NextResponse.json(zone);
    } catch (err) {
        console.error("API Zones POST Error:", err);
        return apiError("Erreur interne");
    }
}
