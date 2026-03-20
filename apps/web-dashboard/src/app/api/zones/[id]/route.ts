import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

/**
 * DELETE /api/zones/[id]
 * Delete a table zone
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { ctx, error } = await withAuth();
    if (error) return error;

    try {
        const { id } = await params;

        // Verify zone belongs to restaurant
        const { data: zone, error: checkError } = await ctx.supabase
            .from("table_zones")
            .select("id")
            .eq("id", id)
            .eq("restaurant_id", ctx.restaurantId)
            .single();

        if (checkError || !zone) {
            return apiError("Zone non trouvée", 404);
        }

        // Check if zone has tables
        const { data: tablesInZone } = await ctx.supabase
            .from("restaurant_tables")
            .select("id")
            .eq("zone_id", id)
            .eq("restaurant_id", ctx.restaurantId);

        if (tablesInZone && tablesInZone.length > 0) {
            return apiError(
                `Impossible de supprimer cette zone. Elle contient ${tablesInZone.length} table(s). Veuillez d'abord supprimer ou réassigner les tables.`,
                400
            );
        }

        // Delete the zone
        const { error: deleteError } = await ctx.supabase
            .from("table_zones")
            .delete()
            .eq("id", id)
            .eq("restaurant_id", ctx.restaurantId);

        if (deleteError) {
            console.error("Error deleting zone:", deleteError);
            return apiError("Erreur lors de la suppression de la zone");
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("DELETE /api/zones/[id] error:", err);
        return apiError("Erreur interne du serveur");
    }
}
