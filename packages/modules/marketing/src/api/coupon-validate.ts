/**
 * Coupon validation (public) — no auth required
 *
 * POST /coupons/validate — Validate a coupon code at checkout
 */
import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { CoreEnv as Env } from "@kbouffe/module-core";

export const couponValidateRoutes = new Hono<{ Bindings: Env }>();

/** POST /coupons/validate */
couponValidateRoutes.post("/", async (c) => {
    const body = await c.req.json();
    const { code, restaurant_id, customer_id, order_subtotal, delivery_type } = body;

    if (!code || !restaurant_id) return c.json({ error: "Code et restaurant requis" }, 400);

    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);

    const { data: coupon, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("restaurant_id", restaurant_id)
        .ilike("code", code.trim())
        .eq("is_active", true)
        .single();

    if (error || !coupon) {
        return c.json({ valid: false, error: "Code promo invalide ou inactif" });
    }

    const now = new Date();
    if (coupon.starts_at && new Date(coupon.starts_at) > now) {
        return c.json({ valid: false, error: "Ce code n'est pas encore actif" });
    }
    if (coupon.expires_at && new Date(coupon.expires_at) < now) {
        return c.json({ valid: false, error: "Ce code promo a expiré" });
    }
    if (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses) {
        return c.json({ valid: false, error: "Ce code promo a atteint sa limite d'utilisation" });
    }

    if (customer_id && coupon.max_uses_per_customer) {
        const { count } = await supabase
            .from("coupon_uses")
            .select("*", { count: "exact", head: true })
            .eq("coupon_id", coupon.id)
            .eq("customer_id", customer_id);

        if ((count ?? 0) >= coupon.max_uses_per_customer) {
            return c.json({ valid: false, error: "Vous avez déjà utilisé ce code promo" });
        }
    }

    if (order_subtotal !== undefined && order_subtotal < (coupon.min_order ?? 0)) {
        return c.json({ valid: false, error: `Commande minimum de ${coupon.min_order} FCFA requis` });
    }

    if (coupon.applies_to !== "all" && delivery_type && coupon.applies_to !== delivery_type) {
        const label = coupon.applies_to === "delivery" ? "livraison" : coupon.applies_to === "pickup" ? "retrait" : "sur place";
        return c.json({ valid: false, error: `Ce code est réservé aux commandes ${label}` });
    }

    let discountAmount: number;
    if (coupon.type === "percent") {
        discountAmount = Math.round((order_subtotal ?? 0) * (coupon.value / 100));
        if (coupon.max_discount !== null) discountAmount = Math.min(discountAmount, coupon.max_discount);
    } else {
        discountAmount = coupon.value;
    }

    return c.json({
        valid: true,
        coupon_id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        value: coupon.value,
        discount_amount: discountAmount,
    });
});
