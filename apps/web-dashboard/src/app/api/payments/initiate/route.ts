import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

/**
 * POST /api/payments/initiate
 * Initiate a mobile money payment. Creates a pending transaction record.
 * Real MTN/Orange API integration will come later.
 */
export async function POST(request: NextRequest) {
  const { ctx, error } = await withAuth();
  if (error) return error;
  const { supabase } = ctx;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError("Corps de requête invalide", 400);
  }

  const { order_id, amount, phone_number, provider } = body as {
    order_id?: string;
    amount?: number;
    phone_number?: string;
    provider?: string;
  };

  // Validate required fields
  if (!order_id) return apiError("order_id est requis", 400);
  if (!amount || amount <= 0) return apiError("Montant invalide", 400);
  if (!phone_number || phone_number.trim().length < 9) {
    return apiError("Numéro de téléphone invalide", 400);
  }
  if (!provider || !["mtn_momo", "orange_money"].includes(provider)) {
    return apiError("Fournisseur invalide. Utilisez 'mtn_momo' ou 'orange_money'", 400);
  }

  // Generate unique reference ID: KB-{timestamp}-{random}
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const referenceId = `KB-${timestamp}-${random}`;

  // Create pending payment transaction
  const { data, error: dbError } = await supabase
    .from("payment_transactions" as any)
    .insert({
      order_id,
      amount,
      currency: "XAF",
      status: "pending",
      provider,
      phone_number: phone_number.trim(),
      reference_id: referenceId,
    })
    .select()
    .single();

  if (dbError) {
    console.error("Payment initiation error:", dbError);
    return apiError("Erreur lors de l'initiation du paiement", 500);
  }

  // Build user-facing instructions based on provider
  const providerName = provider === "mtn_momo" ? "MTN MoMo" : "Orange Money";
  const dialCode = provider === "mtn_momo" ? "*126#" : "#150#";

  const instructions = [
    `Ouvrez votre application ${providerName} ou composez ${dialCode}.`,
    `Sélectionnez "Paiement" ou "Transfert".`,
    `Entrez le montant : ${amount.toLocaleString("fr-CM")} FCFA.`,
    `Utilisez la référence : ${referenceId}`,
    `Confirmez la transaction avec votre code PIN.`,
    `Le restaurant confirmera la réception de votre paiement.`,
  ];

  return NextResponse.json({
    transaction_id: (data as any).id,
    reference_id: referenceId,
    status: "pending",
    instructions,
  });
}
