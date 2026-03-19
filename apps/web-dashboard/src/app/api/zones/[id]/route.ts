import { NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

/**
 * DELETE /api/zones/[id]
 * Deletes a table zone.
 */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { ctx, error } = await withAuth();
    if (error) return error;

    try {
        const { id } = await params;
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
        console.error("API Zones DELETE Error:", err);
        return apiError("Erreur interne");
    }
}
