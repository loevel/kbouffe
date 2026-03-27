import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/server";
import {
  getRequestToPayStatus,
  mapMtnStatusToPaymentStatus,
} from "@/lib/payments/mtn";

interface PaymentTxStatusLite {
  id: string;
  order_id: string | null;
  restaurant_id: string;
  reference_id: string;
  status: string;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ referenceId: string }> }
) {
  try {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { ctx } = auth;

    const { referenceId } = await params;
    const admin = await createAdminClient();

    const { data: txRaw, error: txError } = await admin
      .from("payment_transactions")
      .select("id, order_id, restaurant_id, reference_id, status")
      .eq("reference_id", referenceId)
      .eq("restaurant_id", ctx.restaurantId)
      .single();

    const tx = txRaw as unknown as PaymentTxStatusLite | null;

    if (txError || !tx) {
      return apiError("Transaction introuvable", 404);
    }

    const providerPayload = await getRequestToPayStatus(referenceId);
    const providerStatus = String(providerPayload.status ?? "PENDING");
    const mappedStatus = mapMtnStatusToPaymentStatus(providerStatus);

    await admin
      .from("payment_transactions")
      .update({
        status: mappedStatus,
        provider_status: providerStatus,
        provider_response: providerPayload,
        completed_at:
          mappedStatus === "paid" ? new Date().toISOString() : null,
        failed_reason:
          mappedStatus === "failed"
            ? String(providerPayload.reason ?? providerPayload.financialTransactionId ?? "FAILED")
            : null,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", tx.id);

    if (tx.order_id) {
      const orderPaymentStatus =
        mappedStatus === "paid"
          ? "paid"
          : mappedStatus === "failed"
          ? "failed"
          : "pending";

      await admin
        .from("orders")
        .update({
          payment_status: orderPaymentStatus,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", tx.order_id)
        .eq("restaurant_id", ctx.restaurantId);
    }

    return NextResponse.json({
      success: true,
      payment: {
        referenceId,
        status: mappedStatus,
        providerStatus,
      },
      providerPayload,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur statut paiement";
    console.error("GET /api/payments/mtn/status/[referenceId] error:", error);
    return apiError(message, 502);
  }
}
