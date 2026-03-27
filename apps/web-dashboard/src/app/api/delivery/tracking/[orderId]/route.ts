/**
 * GET  /api/delivery/tracking/[orderId] — Get tracking session (public, order ID = token)
 * POST /api/delivery/tracking/[orderId] — Update deliverer GPS position (merchant auth)
 * PUT  /api/delivery/tracking/[orderId] — Start/init tracking session (merchant auth)
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/server";

type Params = Promise<{ orderId: string }>;

/**
 * GET — Public endpoint to get tracking data for an order.
 * The order UUID is the opaque access token.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { orderId } = await params;
    const supabase = await createAdminClient();

    const { data: tracking, error } = await (supabase as any)
      .from("delivery_tracking")
      .select("order_id, client_lat, client_lng, client_address, deliverer_lat, deliverer_lng, deliverer_name, status, started_at, updated_at")
      .eq("order_id", orderId)
      .single();

    if (error || !tracking) {
      return NextResponse.json({ error: "Session de suivi introuvable" }, { status: 404 });
    }

    return NextResponse.json({ tracking });
  } catch (err) {
    console.error("GET /api/delivery/tracking/[orderId] error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * POST — Merchant/deliverer updates their GPS position.
 * Body: { lat, lng, deliverer_name? }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { ctx } = auth;

  try {
    const { orderId } = await params;
    const body = await request.json();
    const { lat, lng, deliverer_name } = body;

    if (typeof lat !== "number" || typeof lng !== "number") {
      return apiError("lat et lng sont requis (number)", 400);
    }

    // Verify order belongs to this restaurant
    const { data: order } = await ctx.supabase
      .from("orders")
      .select("id, restaurant_id")
      .eq("id", orderId)
      .eq("restaurant_id", ctx.restaurantId)
      .single();

    if (!order) return apiError("Commande non trouvée", 404);

    // Upsert tracking position
    const updatePayload: Record<string, any> = {
      deliverer_lat: lat,
      deliverer_lng: lng,
    };
    if (deliverer_name) updatePayload.deliverer_name = deliverer_name;

    const { data: tracking, error } = await (ctx.supabase as any)
      .from("delivery_tracking")
      .update(updatePayload)
      .eq("order_id", orderId)
      .select()
      .single();

    if (error) {
      console.error("Error updating tracking:", error);
      return apiError("Erreur lors de la mise à jour de la position");
    }

    return NextResponse.json({ tracking });
  } catch (err) {
    console.error("POST /api/delivery/tracking/[orderId] error:", err);
    return apiError("Erreur serveur");
  }
}

/**
 * PUT — Start a tracking session manually.
 * Body: { client_lat?, client_lng?, deliverer_name? }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { ctx } = auth;

  try {
    const { orderId } = await params;
    const body = await request.json();

    // Verify order belongs to this restaurant
    const { data: order } = await ctx.supabase
      .from("orders")
      .select("id, restaurant_id, delivery_address, status")
      .eq("id", orderId)
      .eq("restaurant_id", ctx.restaurantId)
      .single();

    if (!order) return apiError("Commande non trouvée", 404);

    const { data: tracking, error } = await (ctx.supabase as any)
      .from("delivery_tracking")
      .upsert({
        order_id: orderId,
        restaurant_id: ctx.restaurantId,
        client_lat: body.client_lat ?? null,
        client_lng: body.client_lng ?? null,
        client_address: (order as any).delivery_address ?? null,
        deliverer_name: body.deliverer_name ?? null,
        status: "active",
        started_at: new Date().toISOString(),
      }, { onConflict: "order_id" })
      .select()
      .single();

    if (error) {
      console.error("Error creating tracking session:", error);
      return apiError("Erreur lors de la création de la session de suivi");
    }

    return NextResponse.json({ tracking }, { status: 201 });
  } catch (err) {
    console.error("PUT /api/delivery/tracking/[orderId] error:", err);
    return apiError("Erreur serveur");
  }
}
