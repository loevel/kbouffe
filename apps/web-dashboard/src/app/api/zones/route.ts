import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

/**
 * GET /api/zones
 * Get all zones for the restaurant
 */
export async function GET(request: NextRequest) {
    const { ctx, error } = await withAuth();
    if (error) return error;

    try {
        const { data: zones, error: fetchError } = await ctx.supabase
            .from("table_zones")
            .select("id, name, type, description, sort_order, is_active, image_url, image_urls, color, capacity, min_party_size, amenities, pricing_note")
            .eq("restaurant_id", ctx.restaurantId)
            .order("sort_order", { ascending: true });

        if (fetchError) {
            console.error("Error fetching zones:", fetchError);
            return apiError("Erreur lors de la récupération des zones");
        }

        return NextResponse.json({
            zones: zones || [],
            total: zones?.length || 0,
        });
    } catch (err) {
        console.error("GET /api/zones error:", err);
        return apiError("Erreur interne");
    }
}

/**
 * POST /api/zones
 * Creates a new table zone.
 */
export async function POST(request: NextRequest) {
    const { ctx, error } = await withAuth();
    if (error) return error;

    try {
        const body = await request.json();
        const { name, type } = body;

        if (!name?.trim()) {
            return apiError("Le nom de la zone est requis", 400);
        }

        if (!type?.trim()) {
            return apiError("Le type de zone est requis", 400);
        }

        const validTypes = ["indoor", "outdoor", "terrace", "vip", "air_conditioned"];
        if (!validTypes.includes(type)) {
            return apiError(
                `Type de zone invalide. Types valides: ${validTypes.join(", ")}`,
                400
            );
        }

        const { data: zone, error: insertError } = await ctx.supabase
            .from("table_zones")
            .insert({
                restaurant_id: ctx.restaurantId,
                name: name.trim(),
                type: type.trim(),
                is_active: true,
                sort_order: 0,
                description: body.description ?? null,
                image_url: body.image_url ?? null,
                image_urls: body.image_urls ?? [],
                color: body.color ?? "#6366f1",
                capacity: body.capacity ?? 0,
                min_party_size: body.min_party_size ?? 1,
                amenities: body.amenities ?? [],
                pricing_note: body.pricing_note ?? null,
            })
            .select()
            .single();

        if (insertError) {
            console.error("Error creating zone:", {
                code: insertError.code,
                message: insertError.message,
                details: insertError.details,
            });

            // Return detailed error message
            const errorMsg = insertError.message || "Erreur lors de la création de la zone";
            return apiError(`${errorMsg}${insertError.details ? ` (${insertError.details})` : ""}`);
        }

        return NextResponse.json(zone, { status: 201 });
    } catch (err) {
        console.error("POST /api/zones error:", err);
        return apiError("Erreur interne du serveur");
    }
}
