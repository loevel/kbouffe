import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/marketplace/purchase
 * Permet à un restaurateur d'acheter un pack
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Non authentifié" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { serviceId, restaurantId } = body;

        if (!serviceId || !restaurantId) {
            return NextResponse.json(
                { error: "serviceId et restaurantId requis" },
                { status: 400 }
            );
        }

        // Verify restaurant belongs to the user
        const { data: restaurant, error: restaurantError } = await supabase
            .from("restaurants")
            .select("id, owner_id")
            .eq("id", restaurantId)
            .single();

        if (restaurantError || !restaurant || restaurant.owner_id !== user.id) {
            return NextResponse.json(
                { error: "Accès refusé" },
                { status: 403 }
            );
        }

        // Get pack details from marketplace_services
        const { data: pack, error: packError } = await (supabase
            .from("marketplace_services" as any)
            .select("*")
            .eq("id", serviceId)
            .eq("is_active", true)
            .single() as any);

        if (packError || !pack) {
            return NextResponse.json(
                { error: "Pack non trouvé ou inactif" },
                { status: 404 }
            );
        }

        // Calculate expiry
        const startsAt = new Date();
        const expiresAt = pack.duration_days
            ? new Date(Date.now() + pack.duration_days * 24 * 60 * 60 * 1000)
            : null;

        // Insert purchase record
        const { data: purchase, error: purchaseError } = await (supabase
            .from("marketplace_purchases" as any)
            .insert({
                restaurant_id: restaurantId,
                service_id: serviceId,
                status: "active",
                starts_at: startsAt.toISOString(),
                expires_at: expiresAt?.toISOString() || null,
                amount_paid: pack.price,
                notes: `Achat de ${pack.name} via dashboard`,
            })
            .select("id")
            .single() as any);

        if (purchaseError) {
            console.error("Purchase insert error:", purchaseError);
            return NextResponse.json(
                { error: "Erreur lors de l'enregistrement de l'achat" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                purchase_id: purchase.id,
                pack_name: pack.name,
                amount: pack.price,
                currency: 'XAF',
                expires_at: expiresAt?.toISOString() || null,
            }
        }, { status: 201 });
    } catch (error) {
        console.error("Marketplace purchase API error:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}
