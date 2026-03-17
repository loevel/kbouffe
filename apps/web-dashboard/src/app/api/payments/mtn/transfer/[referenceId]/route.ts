/**
 * GET /api/payments/mtn/transfer/[referenceId] — Check disbursement status.
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/server";
import {
  getTransferStatus,
  mapTransferStatus,
} from "@/lib/payments/mtn-disbursement";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ referenceId: string }> }
) {
  try {
    const auth = await withAuth();
    if (auth.error) return auth.error;

    const { referenceId } = await params;

    const providerPayload = await getTransferStatus(referenceId);
    const providerStatus = String(providerPayload.status ?? "PENDING");
    const mappedStatus = mapTransferStatus(providerStatus);

    // Try to update the payout status in DB
    const admin = await createAdminClient();

    const { data: payoutRaw } = await admin
      .from("payouts")
      .select("id")
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
        .eq("reference_id", referenceId);
    }

    return NextResponse.json({
      success: true,
      transfer: {
        referenceId,
        status: mappedStatus,
        providerStatus,
        financialTransactionId: providerPayload.financialTransactionId,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erreur statut transfert";
    console.error(
      "GET /api/payments/mtn/transfer/[referenceId] error:",
      error
    );
    return apiError(message, 502);
  }
}
