import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

/**
 * POST /api/payments/confirm
 * Manually confirm a pending payment (admin/owner action).
 * Updates payment_transactions status to 'completed' and the order status to 'confirmed'.
 */
export async function POST(request: NextRequest) {
  const { ctx, error } = await withAuth();
  if (error) return error;
  const { restaurantId, supabase } = ctx;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError("Corps de requête invalide", 400);
  }

  const { transaction_id } = body as { transaction_id?: string };

  if (!transaction_id) {
    return apiError("transaction_id est requis", 400);
  }

  // Fetch the transaction to verify it exists and is pending
  const { data: transaction, error: fetchError } = await supabase
    .from("payment_transactions" as any)
    .select("*, order:order_id(id, restaurant_id, status)")
    .eq("id", transaction_id)
    .maybeSingle();

  if (fetchError || !transaction) {
    return apiError("Transaction introuvable", 404);
  }

  const tx = transaction as any;

  if (tx.status === "completed") {
    return apiError("Cette transaction est déjà confirmée", 400);
  }

  if (tx.status === "failed" || tx.status === "cancelled") {
    return apiError("Impossible de confirmer une transaction annulée ou échouée", 400);
  }

  // Verify the order belongs to this restaurant
  if (tx.order?.restaurant_id && tx.order.restaurant_id !== restaurantId) {
    return apiError("Accès non autorisé à cette transaction", 403);
  }

  // Update transaction status to completed
  const { error: updateTxError } = await supabase
    .from("payment_transactions" as any)
    .update({ status: "completed" })
    .eq("id", transaction_id);

  if (updateTxError) {
    console.error("Transaction update error:", updateTxError);
    return apiError("Erreur lors de la confirmation du paiement", 500);
  }

  // Update the order status to confirmed
  if (tx.order_id) {
    const { error: updateOrderError } = await supabase
      .from("orders" as any)
      .update({ status: "confirmed" })
      .eq("id", tx.order_id);

    if (updateOrderError) {
      console.error("Order update error:", updateOrderError);
      // Transaction is already confirmed, log but don't fail the response
    }
  }

  return NextResponse.json({
    success: true,
    transaction_id,
    status: "completed",
    message: "Paiement confirmé avec succès",
  });
}
