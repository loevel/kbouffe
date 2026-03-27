/**
 * PATCH /api/driver/orders/[id]
 * Actions livreur :
 *   body { action: "pickup" }                          → ready → out_for_delivery
 *   body { action: "deliver", delivery_code: "XXXXX" } → out_for_delivery/delivering → delivered
 *
 * Pour l'action "deliver", le code de confirmation doit correspondre
 * au delivery_code de la commande (communiqué par le client).
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient as createRawClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { pushOrderStatusChange } from "@/lib/firebase/order-push";

type Params = Promise<{ id: string }>;

const VALID_ACTIONS = ["pickup", "deliver"] as const;
type DriverAction = (typeof VALID_ACTIONS)[number];

export async function PATCH(
    request: NextRequest,
    { params }: { params: Params }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        let action: DriverAction = "deliver";
        let deliveryCode: string | undefined;
        try {
            const body = await request.json();
            if (body?.action && VALID_ACTIONS.includes(body.action)) {
                action = body.action;
            }
            if (body?.delivery_code) {
                deliveryCode = String(body.delivery_code).trim().toUpperCase();
            }
        } catch {
            // empty body → default "deliver"
        }

        // Code obligatoire pour confirmer la livraison
        if (action === "deliver" && !deliveryCode) {
            return NextResponse.json({ error: "Le code de confirmation est requis" }, { status: 400 });
        }

        const adminDb = createRawClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const transitions: Record<DriverAction, { from: string[]; to: string }> = {
            pickup:  { from: ["ready"], to: "out_for_delivery" },
            deliver: { from: ["out_for_delivery", "delivering"], to: "delivered" },
        };
        const { from, to } = transitions[action];

        const { data: order, error: fetchError } = await adminDb
            .from("orders")
            .select("id, status, driver_id, delivery_code")
            .eq("id", id)
            .eq("driver_id", user.id)
            .in("status", from)
            .maybeSingle();

        if (fetchError || !order) {
            return NextResponse.json({ error: "Commande introuvable ou accès refusé" }, { status: 404 });
        }

        // Validation du code de confirmation
        if (action === "deliver") {
            if (!order.delivery_code || order.delivery_code !== deliveryCode) {
                return NextResponse.json({ error: "Code incorrect. Demandez le code au client." }, { status: 400 });
            }
        }

        const now = new Date().toISOString();
        const updateData: Record<string, string> = { status: to, updated_at: now };
        if (action === "deliver") {
            updateData.delivered_at = now;
        }

        const { error: updateError } = await adminDb
            .from("orders")
            .update(updateData)
            .eq("id", id)
            .eq("driver_id", user.id);

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        // ── Push notifications (fire-and-forget) ────────────────────
        const { data: orderFull } = await adminDb
            .from("orders")
            .select("customer_id, restaurant_id, driver_id, total, delivery_type, restaurants(name)")
            .eq("id", id)
            .single();

        if (orderFull) {
            const o = orderFull as any;
            pushOrderStatusChange(adminDb, to, {
                orderId: id,
                orderRef: "",
                restaurantId: o.restaurant_id,
                restaurantName: o.restaurants?.name ?? "Restaurant",
                customerId: o.customer_id,
                driverId: o.driver_id ?? user.id,
                total: o.total,
                deliveryType: o.delivery_type,
            }).catch(() => {});
        }

        return NextResponse.json({ success: true, status: to });
    } catch (err) {
        console.error("PATCH /api/driver/orders/[id] error:", err);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
