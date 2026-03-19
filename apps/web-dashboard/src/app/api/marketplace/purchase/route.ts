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

        // Get service details
        const { data: service, error: serviceError } = await supabase
            .from("marketplace_services")
            .select("*")
            .eq("id", serviceId)
            .eq("is_active", true)
            .single();

        if (serviceError || !service) {
            return NextResponse.json(
                { error: "Service non trouvé ou inactif" },
                { status: 404 }
            );
        }

        // Calculate expiration date if duration is set
        const startsAt = new Date();
        let expiresAt: Date | null = null;
        if (service.duration_days) {
            expiresAt = new Date(startsAt);
            expiresAt.setDate(expiresAt.getDate() + service.duration_days);
        }

        // Create purchase record (in real app, would integrate with payment processor)
        const { data: purchase, error: purchaseError } = await supabase
            .from("marketplace_purchases")
            .insert({
                restaurant_id: restaurantId,
                service_id: serviceId,
                admin_id: user.id, // Current user initiating the purchase
                status: "active",
                starts_at: startsAt.toISOString(),
                expires_at: expiresAt?.toISOString() || null,
                amount_paid: service.price,
                notes: "Purchase via dashboard",
            })
            .select("*, service:marketplace_services(name, slug, category, icon), restaurant:restaurants(name, slug)")
            .single();

        if (purchaseError) {
            console.error("Purchase error:", purchaseError);
            return NextResponse.json(
                { error: "Erreur lors de l'achat du pack" },
                { status: 500 }
            );
        }

        return NextResponse.json(purchase, { status: 201 });
    } catch (error) {
        console.error("Marketplace purchase API error:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}
