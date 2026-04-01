/**
 * PATCH /api/orders/[id]/splits/[splitId]  — confirm (or update) a split payment
 * DELETE /api/orders/[id]/splits/[splitId] — remove a split
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

type RouteParams = { params: Promise<{ id: string; splitId: string }> };

// ── PATCH: Confirm a split as paid (cash) or update its status ──────────────

export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { supabase, restaurantId } = auth.ctx;
    const { id: orderId, splitId } = await params;

    try {
        const body = await request.json();
        const { payment_status, payer_name, payer_phone } = body as {
            payment_status?: "paid" | "failed" | "pending";
            payer_name?: string;
            payer_phone?: string;
        };

        // Build update payload
        const updates: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        if (payment_status) {
            if (!["paid", "failed", "pending"].includes(payment_status)) {
                return apiError("Statut invalide", 400);
            }
            updates.payment_status = payment_status;
        }
        if (payer_name !== undefined) updates.payer_name = payer_name;
        if (payer_phone !== undefined) updates.payer_phone = payer_phone;

        const { data, error } = await supabase
            .from("order_payment_splits" as any)
            .update(updates as any)
            .eq("id", splitId)
            .eq("order_id", orderId)
            .eq("restaurant_id", restaurantId)
            .select()
            .single();

        if (error || !data) {
            console.error("[PATCH split]", error);
            return apiError("Part de paiement introuvable", 404);
        }

        // Recalculate order payment status from all splits
        await supabase.rpc("recalculate_order_payment_status" as any, {
            p_order_id: orderId,
        });

        // Re-fetch order to return updated status
        const { data: updatedOrder } = await supabase
            .from("orders")
            .select("payment_status")
            .eq("id", orderId)
            .single();

        return NextResponse.json({
            split: data,
            order_payment_status: (updatedOrder as any)?.payment_status ?? "pending",
        });
    } catch (err) {
        console.error("[PATCH split] Unexpected:", err);
        return apiError("Erreur serveur");
    }
}

// ── DELETE: Remove a specific split ─────────────────────────────────────────

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { supabase, restaurantId } = auth.ctx;
    const { id: orderId, splitId } = await params;

    const { error } = await supabase
        .from("order_payment_splits" as any)
        .delete()
        .eq("id", splitId)
        .eq("order_id", orderId)
        .eq("restaurant_id", restaurantId);

    if (error) {
        console.error("[DELETE split]", error);
        return apiError("Erreur lors de la suppression");
    }

    // Check if there are remaining splits
    const { data: remaining } = await supabase
        .from("order_payment_splits" as any)
        .select("id")
        .eq("order_id", orderId)
        .eq("restaurant_id", restaurantId);

    // If no splits remain, revert order to non-split mode
    if (!remaining?.length) {
        await supabase
            .from("orders")
            .update({
                payment_method: "cash",
                split_payment_mode: null,
                updated_at: new Date().toISOString(),
            } as any)
            .eq("id", orderId)
            .eq("restaurant_id", restaurantId);
    }

    return NextResponse.json({ success: true });
}
