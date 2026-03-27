import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

/**
 * PATCH /api/tables/[id]
 * Update table status or other properties
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { ctx, error } = await withAuth();
    if (error) return error;

    try {
        const { id } = await params;
        const body = await request.json();

        // Verify table belongs to restaurant
        const { data: table, error: checkError } = await ctx.supabase
            .from("restaurant_tables")
            .select("id")
            .eq("id", id)
            .eq("restaurant_id", ctx.restaurantId)
            .single();

        if (checkError || !table) {
            return apiError("Table non trouvée", 404);
        }

        // Update allowed fields
        const updateData: Record<string, unknown> = {};
        if (body.status !== undefined) updateData.status = body.status;
        if (body.zone_id !== undefined) updateData.zone_id = body.zone_id;
        if (body.capacity !== undefined) updateData.capacity = body.capacity;
        if (body.number !== undefined) updateData.number = body.number;
        if (body.is_active !== undefined) updateData.is_active = body.is_active;

        updateData.updated_at = new Date().toISOString();

        const { data: updatedTable, error: updateError } = await ctx.supabase
            .from("restaurant_tables")
            .update(updateData)
            .eq("id", id)
            .eq("restaurant_id", ctx.restaurantId)
            .select()
            .single();

        if (updateError) {
            console.error("Error updating table:", updateError);
            return apiError("Erreur lors de la mise à jour");
        }

        return NextResponse.json(updatedTable);
    } catch (err) {
        console.error("PATCH /api/tables/[id] error:", err);
        return apiError("Erreur interne");
    }
}

/**
 * DELETE /api/tables/[id]
 * Delete a table
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { ctx, error } = await withAuth();
    if (error) return error;

    try {
        const { id } = await params;

        const { error: deleteError } = await ctx.supabase
            .from("restaurant_tables")
            .delete()
            .eq("id", id)
            .eq("restaurant_id", ctx.restaurantId);

        if (deleteError) {
            console.error("Error deleting table:", deleteError);
            return apiError("Erreur lors de la suppression");
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("DELETE /api/tables/[id] error:", err);
        return apiError("Erreur interne");
    }
}
