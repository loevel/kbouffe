/**
 * PATCH /api/orders/[id]/recall — Convert a parked (draft) order into a real
 * pending order, confirming the payment method.
 *
 * Park & Recall feature.
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/server";

// Map frontend payment method keys → DB enum values
const PAYMENT_METHOD_MAP: Record<string, string> = {
  cash: "cash",
  mtn_momo: "mobile_money_mtn",
  orange_money: "mobile_money_orange",
  mixed: "mixed",
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { ctx } = auth;
    const { id } = await params;

    const body = await request.json() as { paymentMethod?: string };

    if (!body.paymentMethod || typeof body.paymentMethod !== "string") {
      return NextResponse.json(
        { error: "Le mode de paiement est requis pour finaliser la commande" },
        { status: 400 }
      );
    }

    const dbPaymentMethod = PAYMENT_METHOD_MAP[body.paymentMethod] ?? body.paymentMethod;

    // Use admin client so staff members (cashiers, managers) can also recall orders
    const admin = await createAdminClient();

    // 1. Verify the order exists, belongs to restaurant, and is a draft
    const { data: order, error: fetchError } = await admin
      .from("orders")
      .select("id, status, total")
      .eq("id", id)
      .eq("restaurant_id", ctx.restaurantId)
      .single();

    if (fetchError || !order) {
      return apiError("Commande non trouvée", 404);
    }

    if ((order as any).status !== "draft") {
      return NextResponse.json(
        { error: "Seules les commandes garées peuvent être rappelées" },
        { status: 400 }
      );
    }

    // 2. Update: draft → pending, confirm payment method, clear draft_label
    const { data: updated, error: updateError } = await admin
      .from("orders")
      .update({
        status: "pending" as any,
        payment_method: dbPaymentMethod as any,
        draft_label: null,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", id)
      .eq("restaurant_id", ctx.restaurantId)
      .select("id, status, total, payment_method")
      .single();

    if (updateError) {
      console.error("Recall order error:", updateError);
      return apiError("Erreur lors du rappel de la commande");
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (err) {
    console.error("PATCH /api/orders/[id]/recall error:", err);
    return apiError("Erreur serveur");
  }
}
