import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  getMtnConfig,
  getRequestToPayStatus,
  mapMtnStatusToPaymentStatus,
} from "@/lib/payments/mtn";

type WebhookPayload = {
  referenceId?: string;
  externalId?: string;
};

interface PaymentTxWebhookLite {
  id: string;
  order_id: string | null;
  restaurant_id: string;
}

function extractReferenceId(
  request: NextRequest,
  body: WebhookPayload
): string | null {
  return (
    body.referenceId ||
    request.nextUrl.searchParams.get("referenceId") ||
    request.headers.get("x-reference-id") ||
    null
  );
}

export async function POST(request: NextRequest) {
  try {
    const config = await getMtnConfig();
    const secret = request.headers.get("x-webhook-secret");

    if (config.webhookSecret && secret !== config.webhookSecret) {
      return NextResponse.json({ error: "Webhook non autorisé" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as WebhookPayload;
    const referenceId = extractReferenceId(request, body);

    if (!referenceId) {
      return NextResponse.json(
        { error: "referenceId manquant" },
        { status: 400 }
      );
    }

    const providerPayload = await getRequestToPayStatus(referenceId);
    const providerStatus = String(providerPayload.status ?? "PENDING");
    const mappedStatus = mapMtnStatusToPaymentStatus(providerStatus);

    const admin = await createAdminClient();

    const { data: txRaw } = await admin
      .from("payment_transactions")
      .select("id, order_id, restaurant_id")
      .eq("reference_id", referenceId)
      .single();

    const tx = txRaw as unknown as PaymentTxWebhookLite | null;

    if (!tx) {
      return NextResponse.json({ success: true, ignored: true });
    }

    await admin
      .from("payment_transactions")
      .update({
        status: mappedStatus,
        provider_status: providerStatus,
        provider_response: providerPayload,
        completed_at: mappedStatus === "paid" ? new Date().toISOString() : null,
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
        .eq("restaurant_id", tx.restaurant_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/payments/mtn/webhook error:", error);
    return NextResponse.json(
      { error: "Erreur webhook paiement" },
      { status: 500 }
    );
  }
}
