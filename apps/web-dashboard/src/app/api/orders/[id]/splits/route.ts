/**
 * GET  /api/orders/[id]/splits  — list payment splits for an order
 * POST /api/orders/[id]/splits  — create payment splits for an order
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

const ALLOWED_METHODS = [
    "cash",
    "mobile_money_mtn",
    "mobile_money_orange",
] as const;

interface SplitInput {
    label: string;
    amount: number;
    payment_method: string;
    payer_phone?: string;
    payer_name?: string;
}

// ── GET: Fetch all splits for an order ──────────────────────────────────────

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { supabase, restaurantId } = auth.ctx;
    const { id: orderId } = await params;

    const { data, error } = await supabase
        .from("order_payment_splits" as any)
        .select("*")
        .eq("order_id", orderId)
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: true });

    if (error) {
        console.error("[GET /api/orders/[id]/splits]", error);
        return apiError("Erreur lors du chargement des parts de paiement");
    }

    return NextResponse.json({ splits: data ?? [] });
}

// ── POST: Create splits for an order ────────────────────────────────────────

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { supabase, restaurantId } = auth.ctx;
    const { id: orderId } = await params;

    try {
        const body = await request.json();
        const { splits, split_mode } = body as {
            splits: SplitInput[];
            split_mode: "mixed_methods" | "split_equal" | "split_by_person";
        };

        if (!splits?.length || splits.length < 2) {
            return apiError("Au moins 2 parts sont nécessaires pour un paiement partagé", 400);
        }

        if (!["mixed_methods", "split_equal", "split_by_person"].includes(split_mode)) {
            return apiError("Mode de split invalide", 400);
        }

        // Validate the order exists and belongs to this restaurant
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .select("id, total, payment_status")
            .eq("id", orderId)
            .eq("restaurant_id", restaurantId)
            .single();

        if (orderError || !order) {
            return apiError("Commande introuvable", 404);
        }

        if ((order as any).payment_status === "paid") {
            return apiError("Cette commande est déjà payée", 400);
        }

        // Validate total amounts match
        const splitTotal = splits.reduce((sum, s) => sum + s.amount, 0);
        if (splitTotal !== (order as any).total) {
            return apiError(
                `Le total des parts (${splitTotal}) ne correspond pas au total de la commande (${(order as any).total})`,
                400,
            );
        }

        // Validate each split
        for (const s of splits) {
            if (!s.amount || s.amount <= 0) {
                return apiError("Chaque part doit avoir un montant positif", 400);
            }
            if (!ALLOWED_METHODS.includes(s.payment_method as any)) {
                return apiError(`Méthode de paiement invalide: ${s.payment_method}`, 400);
            }
        }

        // Delete any existing splits (in case of re-split)
        await supabase
            .from("order_payment_splits" as any)
            .delete()
            .eq("order_id", orderId)
            .eq("restaurant_id", restaurantId);

        // Insert new splits
        const rows = splits.map((s, i) => ({
            order_id: orderId,
            restaurant_id: restaurantId,
            label: s.label || `Part ${i + 1}`,
            amount: s.amount,
            payment_method: s.payment_method,
            payment_status: "pending",
            payer_phone: s.payer_phone || null,
            payer_name: s.payer_name || null,
        }));

        const { data: created, error: insertError } = await supabase
            .from("order_payment_splits" as any)
            .insert(rows as any)
            .select();

        if (insertError) {
            console.error("[POST /api/orders/[id]/splits] insert error:", insertError);
            return apiError("Erreur lors de la création des parts de paiement");
        }

        // Update the order to mark it as split payment
        await supabase
            .from("orders")
            .update({
                payment_method: "mixed",
                split_payment_mode: split_mode,
                updated_at: new Date().toISOString(),
            } as any)
            .eq("id", orderId)
            .eq("restaurant_id", restaurantId);

        return NextResponse.json({ splits: created }, { status: 201 });
    } catch (err) {
        console.error("[POST /api/orders/[id]/splits] Unexpected:", err);
        return apiError("Erreur serveur");
    }
}
