/**
 * Coupon validation (public) — no auth required
 *
 * POST /coupons/validate — Validate a coupon code at checkout
 */
import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { CoreEnv as Env } from "@kbouffe/module-core";

export const couponValidateRoutes = new Hono<{ Bindings: Env }>();

/**
 * POST /validate
 * Validates a coupon's availability.
 * WARNING: This is a read-only check. Actual usage increment should be done
 * atomically in the order creation logic (e.g. via SQL RPC) to prevent race conditions.
 */
couponValidateRoutes.post("/validate", async (c) => {
    const body = await c.req.json();
    const { code, restaurant_id, customer_id, order_subtotal, delivery_type } = body;

    if (!code || !restaurant_id) {
        return c.json({ valid: false, error: "Code et restaurant requis" }, 400);
    }

    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);

    const { data: rpcData, error: rpcError } = await supabase.rpc("validate_and_use_coupon", {
        p_code: code,
        p_restaurant_id: restaurant_id,
        p_customer_id: customer_id,
        p_order_subtotal: Number(order_subtotal || 0),
        p_delivery_type: delivery_type
    });

    if (rpcError) {
        console.error("Coupon RPC error:", rpcError);
        return c.json({ valid: false, error: "Erreur lors de la validation" }, 500);
    }

    if (!rpcData.valid) {
        return c.json({ valid: false, error: rpcData.error });
    }

    // SEC-011: coupon_uses insert removed — the validate_and_use_coupon RPC handles
    // usage atomically (SELECT FOR UPDATE + counter increment). A separate insert
    // here would create a race condition and potential double-counting.

    return c.json({
        valid: true,
        coupon_id: rpcData.coupon_id,
        discount_type: rpcData.discount_type,
        discount_value: rpcData.discount_value,
    });
});
