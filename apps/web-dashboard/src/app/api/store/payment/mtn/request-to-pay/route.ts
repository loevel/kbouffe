import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { mapMtnStatusToPaymentStatus, requestToPay } from "@/lib/payments/mtn";

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
}

interface PaymentTxLite {
  id: string;
  reference_id: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RequestPayload;

    if (!body.orderId || !body.payerMsisdn?.trim()) {
      return NextResponse.json({ error: "orderId et payerMsisdn sont requis" }, { status: 400 });
    }

    const admin = await createAdminClient();

    const { data: orderRaw, error: orderError } = await admin
      .from("orders")
      .select("id, restaurant_id, total")
      .eq("id", body.orderId)
      .single();

    const order = orderRaw as unknown as OrderLite | null;

    if (orderError || !order) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    const referenceId = crypto.randomUUID();
    const externalId = `order-${order.id}`;

    const { data: txRaw, error: txError } = await admin
      .from("payment_transactions")
      .insert({
        restaurant_id: order.restaurant_id,
        order_id: order.id,
        provider: "mtn_momo",
        reference_id: referenceId,
        external_id: externalId,
        payer_msisdn: body.payerMsisdn.trim(),
        amount: order.total,
        currency: "XAF",
        status: "pending",
        provider_status: "PENDING",
      } as never)
      .select("id, reference_id")
      .single();

    const tx = txRaw as unknown as PaymentTxLite | null;

    if (txError || !tx) {
      return NextResponse.json({ error: "Impossible de créer la transaction" }, { status: 500 });
    }

    try {
      await requestToPay({
        referenceId,
        amount: order.total,
        currency: "XAF",
        externalId,
        payerMsisdn: body.payerMsisdn.trim(),
        payerMessage: body.payerMessage ?? "Paiement commande Kbouffe",
        payeeNote: body.payeeNote ?? `Commande ${order.id}`,
      });
    } catch (providerError) {
      const message = providerError instanceof Error ? providerError.message : "Erreur fournisseur MTN";

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

      await admin
        .from("orders")
        .update({ payment_status: "failed", updated_at: new Date().toISOString() } as never)
        .eq("id", order.id)
        .eq("restaurant_id", order.restaurant_id);

      return NextResponse.json(
        {
          success: false,
          orderId: order.id,
          payment: {
            referenceId: tx.reference_id,
            status: "failed",
          },
          error: message,
        },
        { status: 502 }
      );
    }

    const mappedStatus = mapMtnStatusToPaymentStatus("PENDING");

    return NextResponse.json({
      success: true,
      orderId: order.id,
      payment: {
        referenceId: tx.reference_id,
        status: mappedStatus,
      },
    });
  } catch (error) {
    console.error("POST /api/store/payment/mtn/request-to-pay error:", error);
    return NextResponse.json({ error: "Erreur lors de l'initiation du paiement" }, { status: 500 });
  }
}
