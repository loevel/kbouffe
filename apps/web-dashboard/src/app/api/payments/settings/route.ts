import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

/**
 * GET /api/payments/settings
 * Fetch payment settings for the current restaurant.
 */
export async function GET() {
  const { ctx, error } = await withAuth();
  if (error) return error;
  const { restaurantId, supabase } = ctx;

  const { data, error: dbError } = await supabase
    .from("restaurant_payment_settings" as any)
    .select("*")
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  if (dbError) {
    return apiError("Erreur lors de la récupération des paramètres de paiement", 500);
  }

  // Return defaults if no settings exist yet
  if (!data) {
    return NextResponse.json({
      restaurant_id: restaurantId,
      momo_enabled: false,
      momo_phone: "",
      orange_money_enabled: false,
      orange_money_phone: "",
      cash_enabled: true,
      auto_confirm_payments: false,
    });
  }

  return NextResponse.json(data);
}

/**
 * PUT /api/payments/settings
 * Update payment settings for the current restaurant.
 */
export async function PUT(request: NextRequest) {
  const { ctx, error } = await withAuth();
  if (error) return error;
  const { restaurantId, supabase } = ctx;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError("Corps de requête invalide", 400);
  }

  const {
    momo_enabled,
    momo_phone,
    orange_money_enabled,
    orange_money_phone,
    cash_enabled,
    auto_confirm_payments,
  } = body as {
    momo_enabled?: boolean;
    momo_phone?: string;
    orange_money_enabled?: boolean;
    orange_money_phone?: string;
    cash_enabled?: boolean;
    auto_confirm_payments?: boolean;
  };

  // Validate phone numbers when enabling providers
  if (momo_enabled && (!momo_phone || String(momo_phone).trim().length < 9)) {
    return apiError("Un numéro de téléphone MTN MoMo valide est requis", 400);
  }
  if (orange_money_enabled && (!orange_money_phone || String(orange_money_phone).trim().length < 9)) {
    return apiError("Un numéro de téléphone Orange Money valide est requis", 400);
  }

  const payload = {
    restaurant_id: restaurantId,
    momo_enabled: !!momo_enabled,
    momo_phone: momo_phone ? String(momo_phone).trim() : null,
    orange_money_enabled: !!orange_money_enabled,
    orange_money_phone: orange_money_phone ? String(orange_money_phone).trim() : null,
    cash_enabled: cash_enabled !== false,
    auto_confirm_payments: !!auto_confirm_payments,
    updated_at: new Date().toISOString(),
  };

  // Upsert: insert if not exists, update if exists
  const { data, error: dbError } = await supabase
    .from("restaurant_payment_settings" as any)
    .upsert(payload, { onConflict: "restaurant_id" })
    .select()
    .single();

  if (dbError) {
    console.error("Payment settings upsert error:", dbError);
    return apiError("Erreur lors de la mise à jour des paramètres de paiement", 500);
  }

  return NextResponse.json(data);
}
