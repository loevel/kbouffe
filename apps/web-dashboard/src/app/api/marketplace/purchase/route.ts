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

        // Get pack details
        const { data: pack, error: packError } = await supabase
            .from("marketplace_packs")
            .select("*")
            .eq("id", serviceId)
            .eq("is_active", true)
            .single();

        if (packError || !pack) {
            return NextResponse.json(
                { error: "Pack non trouvé ou inactif" },
                { status: 404 }
            );
        }

        // Initiate purchase via RPC (payment integration)
        const { data: purchaseData, error: purchaseError } = await supabase.rpc(
            'marketplace_initiate_purchase',
            {
                p_restaurant_id: restaurantId,
                p_pack_id: serviceId,
                p_payer_msisdn: user.email, // Using email as fallback msisdn
            }
        );

        if (purchaseError || !purchaseData || purchaseData.length === 0) {
            console.error("Purchase error:", purchaseError);
            return NextResponse.json(
                { error: "Erreur lors de l'initiation de l'achat" },
                { status: 500 }
            );
        }

        const { subscription_id, transaction_id, reference_id } = purchaseData[0];

        return NextResponse.json({
            success: true,
            data: {
                subscription_id,
                transaction_id,
                reference_id,
                amount: pack.price,
                currency: 'XAF',
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
