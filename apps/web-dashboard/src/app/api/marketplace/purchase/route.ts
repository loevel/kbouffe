import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { withAuth } from "@/lib/api/helpers";

/**
 * POST /api/marketplace/purchase
 * Permet à un restaurateur d'acheter un pack
 */
export async function POST(request: NextRequest) {
    try {
        const auth = await withAuth();
        if (auth.error) return auth.error;
        const { restaurantId, userId } = auth.ctx;
        const supabase = await createAdminClient();

        const body = await request.json();
        const { serviceId } = body;

        if (!serviceId) {
            return NextResponse.json(
                { error: "serviceId requis" },
                { status: 400 }
            );
        }

        // Get pack details from marketplace_services
        const { data: pack, error: packError } = await supabase
            .from("marketplace_services")
            .select("id, name, price, duration_days")
            .eq("id", serviceId)
            .eq("is_active", true)
            .single();

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
        const { data: purchase, error: purchaseError } = await supabase
            .from("marketplace_purchases")
            .insert({
                restaurant_id: restaurantId,
                service_id: serviceId,
                admin_id: userId,
                status: "active",
                starts_at: startsAt.toISOString(),
                expires_at: expiresAt?.toISOString() || null,
                amount_paid: pack.price,
                notes: `Achat de ${pack.name} via dashboard`,
            })
            .select("id")
            .single();

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
