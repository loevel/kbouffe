/**
 * POST /api/payments/mtn/disbursement-webhook — Webhook for disbursement callbacks.
 *
 * Called by MTN when a transfer status changes.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  getTransferStatus,
  mapTransferStatus,
} from "@/lib/payments/mtn-disbursement";

type WebhookPayload = {
  referenceId?: string;
  externalId?: string;
};

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
    const body = (await request.json().catch(() => ({}))) as WebhookPayload;
    const referenceId = extractReferenceId(request, body);

    if (!referenceId) {
      return NextResponse.json(
        { error: "referenceId manquant" },
        { status: 400 }
      );
    }

    // Fetch actual status from MTN
    const providerPayload = await getTransferStatus(referenceId);
    const providerStatus = String(providerPayload.status ?? "PENDING");
    const mappedStatus = mapTransferStatus(providerStatus);

    const admin = await createAdminClient();

    // Update payout record
    const { data: payoutRaw } = await admin
      .from("payouts")
      .select("id, restaurant_id")
      .eq("reference_id", referenceId)
      .single();

    if (payoutRaw) {
      await admin
        .from("payouts")
        .update({
          status: mappedStatus,
          completed_at:
            mappedStatus === "paid" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", (payoutRaw as { id: string }).id);
    }

    return NextResponse.json({ success: true, status: mappedStatus });
  } catch (error) {
    console.error("POST /api/payments/mtn/disbursement-webhook error:", error);
    return NextResponse.json(
      { error: "Erreur webhook" },
      { status: 500 }
    );
  }
}
