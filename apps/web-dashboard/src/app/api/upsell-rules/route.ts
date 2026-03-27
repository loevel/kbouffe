/**
 * GET  /api/upsell-rules   — list rules for merchant's restaurant
 * POST /api/upsell-rules   — create a new upsell rule
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

export async function GET() {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { supabase, restaurantId } = auth.ctx;

    const { data, error } = await supabase
        .from("upsell_rules")
        .select(`
            id,
            trigger_type,
            trigger_product_id,
            trigger_category_id,
            trigger_min_cart,
            suggested_product_id,
            discount_percent,
            custom_message,
            position,
            priority,
            max_suggestions,
            is_active,
            created_at
        `)
        .eq("restaurant_id", restaurantId)
        .order("priority", { ascending: false });

    if (error) {
        console.error("[GET /api/upsell-rules]", error);
        return apiError("Erreur lors du chargement des règles d'upsell");
    }

    return NextResponse.json({ rules: data ?? [] });
}

export async function POST(request: NextRequest) {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { supabase, restaurantId } = auth.ctx;

    try {
        const body = await request.json();

        const {
            trigger_type = "global",
            trigger_product_id = null,
            trigger_category_id = null,
            trigger_min_cart = 0,
            suggested_product_id,
            discount_percent = 0,
            custom_message = null,
            position = "pre_checkout",
            priority = 0,
            max_suggestions = 3,
        } = body;

        if (!suggested_product_id) {
            return apiError("suggested_product_id est requis", 400);
        }

        // Verify the suggested product belongs to this restaurant
        const { data: product } = await supabase
            .from("products")
            .select("id")
            .eq("id", suggested_product_id)
            .eq("restaurant_id", restaurantId)
            .maybeSingle();

        if (!product) {
            return apiError("Produit suggéré non trouvé dans votre restaurant", 400);
        }

        const { data, error } = await supabase
            .from("upsell_rules")
            .insert({
                restaurant_id: restaurantId,
                trigger_type,
                trigger_product_id,
                trigger_category_id,
                trigger_min_cart,
                suggested_product_id,
                discount_percent,
                custom_message,
                position,
                priority,
                max_suggestions,
                is_active: true,
            } as any)
            .select()
            .single();

        if (error) {
            console.error("[POST /api/upsell-rules]", error);
            return apiError("Erreur lors de la création de la règle");
        }

        return NextResponse.json({ rule: data }, { status: 201 });
    } catch (err) {
        console.error("[POST /api/upsell-rules] Unexpected:", err);
        return apiError("Erreur serveur");
    }
}
