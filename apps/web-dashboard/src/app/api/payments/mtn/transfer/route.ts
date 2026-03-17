/**
 * POST /api/payments/mtn/transfer — Initiate a MoMo disbursement (payout).
 *
 * Used by the platform to pay restaurants or drivers.
 * Requires admin / platform-level auth (not merchant auth).
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/server";
import { transfer } from "@/lib/payments/mtn-disbursement";

interface TransferPayload {
  payoutId: string;
  payeeMsisdn: string;
  amount: number;
  payeeNote?: string;
}

interface PayoutLite {
  id: string;
  restaurant_id: string;
  amount: number;
  status: string;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { ctx } = auth;

    const body = (await request.json()) as TransferPayload;

    if (!body.payoutId || !body.payeeMsisdn?.trim() || !body.amount) {
      return apiError("payoutId, payeeMsisdn et amount sont requis", 400);
    }

    if (body.amount <= 0) {
      return apiError("Le montant doit etre positif", 400);
    }

    const admin = await createAdminClient();

    // Verify payout exists and belongs to the merchant's restaurant
    const { data: payoutRaw, error: payoutError } = await admin
      .from("payouts")
      .select("id, restaurant_id, amount, status")
      .eq("id", body.payoutId)
      .eq("restaurant_id", ctx.restaurantId)
      .single();

    const payout = payoutRaw as unknown as PayoutLite | null;

    if (payoutError || !payout) {
      return apiError("Versement introuvable", 404);
    }

    if (payout.status === "paid") {
      return apiError("Ce versement a deja ete effectue", 400);
    }

    const referenceId = crypto.randomUUID();
    const externalId = `payout-${payout.id}`;

    // Update payout status to processing
    await admin
      .from("payouts")
      .update({
        status: "processing",
        reference_id: referenceId,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", payout.id);

    try {
      await transfer({
        referenceId,
        amount: body.amount,
        currency: "XAF",
        externalId,
        payeeMsisdn: body.payeeMsisdn.trim(),
        payerMessage: "Versement Kbouffe",
        payeeNote:
          body.payeeNote ?? `Versement restaurant - ${payout.id}`,
      });

      return NextResponse.json({
        success: true,
        transfer: {
          referenceId,
          payoutId: payout.id,
          amount: body.amount,
          status: "pending",
        },
      });
    } catch (providerError) {
      const message =
        providerError instanceof Error
          ? providerError.message
          : "Erreur fournisseur MTN Disbursement";

      // Revert payout status
      await admin
        .from("payouts")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", payout.id);

      return apiError(message, 502);
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur serveur";
    console.error("POST /api/payments/mtn/transfer error:", error);
    return apiError(message, 500);
  }
}
