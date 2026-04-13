/**
 * POST /api/gift-cards/validate
 * Public checkout endpoint: validate a gift card against a restaurant and order total.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api/helpers";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const code = String(body.code ?? "").trim().toUpperCase();
        const restaurantId = String(body.restaurant_id ?? "").trim();
        const orderTotal = Math.max(0, Number(body.order_total ?? 0));

        if (!code || !restaurantId) {
            return apiError("Code et restaurant requis", 400);
        }

        const supabase = await createAdminClient();
        const { data: card, error } = await supabase
            .from("gift_cards")
            .select("id, code, current_balance, expires_at, is_active")
            .eq("restaurant_id", restaurantId)
            .eq("code", code)
            .eq("is_active", true)
            .maybeSingle();

        if (error) {
            console.error("[POST /api/gift-cards/validate] Supabase error:", error);
            return apiError("Erreur lors de la validation");
        }
        if (!card) {
            return NextResponse.json({ valid: false, error: "Code carte cadeau invalide ou inactif" });
        }
        if (card.expires_at && new Date(card.expires_at) < new Date()) {
            return NextResponse.json({ valid: false, error: "Cette carte cadeau a expiré" });
        }
        if ((card.current_balance ?? 0) <= 0) {
            return NextResponse.json({ valid: false, error: "Le solde de cette carte cadeau est épuisé" });
        }

        const amountApplicable = orderTotal > 0
            ? Math.min(card.current_balance, orderTotal)
            : card.current_balance;

        return NextResponse.json({
            valid: true,
            gift_card_id: card.id,
            code: card.code,
            current_balance: card.current_balance,
            amount_applicable: amountApplicable,
            remaining_to_pay: Math.max(0, orderTotal - amountApplicable),
        });
    } catch (error) {
        console.error("[POST /api/gift-cards/validate] Unexpected error:", error);
        return apiError("Erreur serveur");
    }
}
