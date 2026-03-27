import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

/**
 * PATCH /api/zones/[id]
 * Update a table zone
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

        // Build update payload — only include fields that were sent
        const updateData: Record<string, unknown> = {};
        if (body.name !== undefined) updateData.name = body.name.trim();
        if (body.type !== undefined) updateData.type = body.type;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.image_url !== undefined) updateData.image_url = body.image_url;
        if (body.image_urls !== undefined) updateData.image_urls = body.image_urls;
        if (body.color !== undefined) updateData.color = body.color;
        if (body.capacity !== undefined) updateData.capacity = body.capacity;
        if (body.min_party_size !== undefined) updateData.min_party_size = body.min_party_size;
        if (body.amenities !== undefined) updateData.amenities = body.amenities;
        if (body.pricing_note !== undefined) updateData.pricing_note = body.pricing_note;
        if (body.is_active !== undefined) updateData.is_active = body.is_active;
        if (body.sort_order !== undefined) updateData.sort_order = body.sort_order;

        if (Object.keys(updateData).length === 0) {
            return apiError("Aucune donnée à mettre à jour", 400);
        }

        const { data: zone, error: updateError } = await ctx.supabase
            .from("table_zones")
            .update(updateData)
            .eq("id", id)
            .eq("restaurant_id", ctx.restaurantId)
            .select()
            .single();

        if (updateError) {
            console.error("Error updating zone:", updateError);
            return apiError("Erreur lors de la mise à jour de la zone");
        }

        return NextResponse.json({ success: true, zone });
    } catch (err) {
        console.error("PATCH /api/zones/[id] error:", err);
        return apiError("Erreur interne du serveur");
    }
}

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
