import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/server";
import {
  mapMtnStatusToPaymentStatus,
  requestToPay,
} from "@/lib/payments/mtn";

interface RequestPayload {
  orderId: string;
  payerMsisdn: string;
  payerMessage?: string;
  payeeNote?: string;
}

interface OrderLite {
  id: string;
  restaurant_id: string;
  total: number;
  payment_status: string;
}

interface PaymentTxLite {
  id: string;
  reference_id: string;
  status: string;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { ctx } = auth;

    const body = (await request.json()) as RequestPayload;

    if (!body.orderId || !body.payerMsisdn?.trim()) {
      return apiError("orderId et payerMsisdn sont requis", 400);
    }

    const admin = await createAdminClient();

    const { data: orderRaw, error: orderError } = await admin
      .from("orders")
      .select("id, restaurant_id, total, payment_status")
      .eq("id", body.orderId)
      .eq("restaurant_id", ctx.restaurantId)
      .single();

    const order = orderRaw as unknown as OrderLite | null;

    if (orderError || !order) {
      return apiError("Commande introuvable", 404);
    }

    // Conformité COBAC/BEAC : récupérer le numéro MTN du restaurant.
    // L'argent doit aller DIRECTEMENT au restaurant — KBouffe ne détient pas les fonds.
    const { data: paymentSettings } = await (admin as any)
      .from("restaurant_payment_settings")
      .select("momo_phone, momo_enabled")
      .eq("restaurant_id", ctx.restaurantId)
      .single();

    const payeeMsisdn = (paymentSettings as any)?.momo_phone?.trim() || null;
    if (!payeeMsisdn) {
      return apiError(
        "Ce restaurant n'a pas configuré son numéro MTN Mobile Money. Le paiement ne peut pas être traité.",
        422
      );
    }

    const referenceId = crypto.randomUUID();
    const externalId = `order-${order.id}`;

    const insertPayload = {
      restaurant_id: ctx.restaurantId,
      order_id: order.id,
      provider: "mtn_momo",
      reference_id: referenceId,
      external_id: externalId,
      payer_msisdn: body.payerMsisdn.trim(),
      payee_msisdn: payeeMsisdn,   // traçabilité légale : bénéficiaire direct
      payment_flow: "direct",
      amount: order.total,
      currency: "XAF",
      status: "pending",
      provider_status: "PENDING",
    };

    const { data: txRaw, error: txError } = await admin
      .from("payment_transactions")
      .insert(insertPayload as never)
      .select("id, reference_id, status")
      .single();

    const tx = txRaw as unknown as PaymentTxLite | null;

    if (txError || !tx) {
      return apiError("Impossible de créer la transaction", 500);
    }

    try {
      await requestToPay({
        referenceId,
        amount: order.total,
        currency: "XAF",
        externalId,
        payerMsisdn: body.payerMsisdn.trim(),
        payeeMsisdn,                 // argent va directement au numéro MTN du restaurant
        payerMessage: body.payerMessage ?? "Paiement commande Kbouffe",
        payeeNote: body.payeeNote ?? `Commande ${order.id}`,
      });
    } catch (providerError) {
      const message =
        providerError instanceof Error
          ? providerError.message
          : "Erreur fournisseur MTN";

      await admin
        .from("payment_transactions")
        .update({
          status: "failed",
          provider_status: "FAILED",
          failed_reason: message,
          provider_response: { error: message },
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", tx.id);

      return apiError(message, 502);
    }

    const mappedStatus = mapMtnStatusToPaymentStatus("PENDING");

    return NextResponse.json({
      success: true,
      payment: {
        referenceId: tx.reference_id,
        status: mappedStatus,
      },
    });
  } catch (error) {
    console.error("POST /api/payments/mtn/request-to-pay error:", error);
    return apiError("Erreur lors de l'initiation du paiement");
  }
}
