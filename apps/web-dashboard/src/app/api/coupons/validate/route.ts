/**
 * POST /api/coupons/validate — Validate a coupon code at checkout
 * Public endpoint (called from mobile app with restaurant slug)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api/helpers";
import type { Coupon } from "@/lib/supabase/types";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { code, restaurant_id, customer_id, order_subtotal, delivery_type } = body;

        if (!code || !restaurant_id) return apiError("Code et restaurant requis", 400);

        const supabase = await createClient();

        // Fetch coupon (case-insensitive)
        const { data: couponRaw, error } = await supabase
            .from("coupons")
            .select("*")
            .eq("restaurant_id", restaurant_id)
            .ilike("code", code.trim())
            .eq("is_active", true)
            .single();

        const coupon = couponRaw as Coupon | null;

        if (error || !coupon) {
            return NextResponse.json({ valid: false, error: "Code promo invalide ou inactif" }, { status: 200 });
        }

        const now = new Date();

        // Check validity window
        if (coupon.starts_at && new Date(coupon.starts_at) > now) {
            return NextResponse.json({ valid: false, error: "Ce code n'est pas encore actif" });
        }
        if (coupon.expires_at && new Date(coupon.expires_at) < now) {
            return NextResponse.json({ valid: false, error: "Ce code promo a expiré" });
        }

        // Check global usage limit
        if (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses) {
            return NextResponse.json({ valid: false, error: "Ce code promo a atteint sa limite d'utilisation" });
        }

        // Check per-customer usage
        if (customer_id && coupon.max_uses_per_customer) {
            const { count } = await supabase
                .from("coupon_uses")
                .select("*", { count: "exact", head: true })
                .eq("coupon_id", coupon.id)
                .eq("customer_id", customer_id);

            if ((count ?? 0) >= coupon.max_uses_per_customer) {
                return NextResponse.json({ valid: false, error: "Vous avez déjà utilisé ce code promo" });
            }
        }

        // Check minimum order
        if (order_subtotal !== undefined && order_subtotal < (coupon.min_order ?? 0)) {
            return NextResponse.json({
                valid: false,
                error: `Commande minimum de ${coupon.min_order} FCFA requis`,
            });
        }

        // Check delivery type constraint
        if (coupon.applies_to !== "all" && delivery_type && coupon.applies_to !== delivery_type) {
            const label = coupon.applies_to === "delivery" ? "livraison" : coupon.applies_to === "pickup" ? "retrait" : "sur place";
            return NextResponse.json({ valid: false, error: `Ce code est réservé aux commandes ${label}` });
        }

        // Calculate discount amount
        let discountAmount: number;
        if (coupon.type === "percent") {
            discountAmount = Math.round((order_subtotal ?? 0) * (coupon.value / 100));
            if (coupon.max_discount !== null) {
                discountAmount = Math.min(discountAmount, coupon.max_discount);
            }
        } else {
            discountAmount = coupon.value;
        }

        return NextResponse.json({
            valid: true,
            coupon_id: coupon.id,
            code: coupon.code,
            name: coupon.name,
            type: coupon.type,
            value: coupon.value,
            discount_amount: discountAmount,
        });
    } catch (error) {
        console.error("POST /api/coupons/validate error:", error);
        return apiError("Erreur serveur");
    }
}
