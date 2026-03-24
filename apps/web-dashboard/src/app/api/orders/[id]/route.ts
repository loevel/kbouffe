/**
 * GET    /api/orders/[id] — Get a single order
 * PATCH  /api/orders/[id] — Update order status / notes
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient as createRawClient } from "@supabase/supabase-js";
import { withAuth, apiError } from "@/lib/api/helpers";
import { notifyOrderStatusChange, type NotifiableStatus, type RestaurantSmsSettings } from "@/lib/sms/service";
import { pushOrderStatusChange, pushDriverAssigned } from "@/lib/firebase/order-push";
import { evaluateBadges } from "@/lib/badges/evaluate";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { ctx } = auth;
    const { id } = await params;

    const { data, error } = await ctx.supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .eq("restaurant_id", ctx.restaurantId)
      .single();

    if (error || !data) {
      return apiError("Commande non trouvée", 404);
    }

    return NextResponse.json({ order: data });
  } catch (error) {
    console.error("GET /api/orders/[id] error:", error);
    return apiError("Erreur serveur");
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { ctx } = auth;
    const { id } = await params;

    const body = await request.json();

    // Only allow updating status, payment_status, notes and preparation_time_minutes
    const updateData: Record<string, unknown> = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.payment_status !== undefined)
      updateData.payment_status = body.payment_status;
    if (body.notes !== undefined) updateData.notes = body.notes;

    // ── Driver assignment ──────────────────────────────────────────────
    if (body.driver_id !== undefined) {
      if (body.driver_id === null || body.driver_id === "") {
        updateData.driver_id = null;
      } else {
        const driverId = String(body.driver_id);
        // Use raw Supabase client with service_role key to bypass RLS
        // (restaurant_members has RLS enabled with no policies)
        const adminDb = createRawClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { autoRefreshToken: false, persistSession: false } }
        );
        const { data: driverMember, error: driverError } = await adminDb
          .from("restaurant_members")
          .select("user_id")
          .eq("restaurant_id", ctx.restaurantId)
          .eq("user_id", driverId)
          .eq("role", "driver")
          .eq("status", "active")
          .maybeSingle();

        if (driverError) {
          console.error("Driver validation error:", driverError);
          return apiError("Erreur lors de la vérification du livreur", 500);
        }
        if (!driverMember) {
          return apiError("Livreur invalide ou inactif pour ce restaurant", 400);
        }
        updateData.driver_id = driverId;
      }
    }

    if (body.preparation_time_minutes !== undefined) {
      const preparationTimeMinutes = Number(body.preparation_time_minutes);
      if (
        !Number.isFinite(preparationTimeMinutes) ||
        !Number.isInteger(preparationTimeMinutes) ||
        preparationTimeMinutes <= 0 ||
        preparationTimeMinutes > 600
      ) {
        return apiError("Durée de préparation invalide (1-600 min)", 400);
      }
      updateData.preparation_time_minutes = preparationTimeMinutes;
    }

    if (body.status === "accepted" && updateData.preparation_time_minutes === undefined) {
      return apiError("La durée de préparation est requise pour accepter la commande", 400);
    }

    // Proof of delivery: record delivery metadata when marking as delivered
    if (body.status === "delivered") {
      updateData.delivered_at = new Date().toISOString();
      if (body.delivery_note) {
        updateData.delivery_note = String(body.delivery_note).slice(0, 500);
      }
      if (body.delivered_by) {
        updateData.delivered_by = String(body.delivered_by).slice(0, 100);
      }
    }

    // Scheduled orders: validate scheduled_for if provided
    if (body.scheduled_for !== undefined) {
      if (body.scheduled_for !== null) {
        const scheduledDate = new Date(body.scheduled_for);
        if (isNaN(scheduledDate.getTime())) {
          return apiError("Date de programmation invalide", 400);
        }
        updateData.scheduled_for = scheduledDate.toISOString();
      } else {
        updateData.scheduled_for = null;
      }
    }

    updateData.updated_at = new Date().toISOString();

    // Verify order exists and belongs to restaurant before updating
    const { data: existingOrder, error: checkError } = await ctx.supabase
      .from("orders")
      .select("id, status")
      .eq("id", id)
      .eq("restaurant_id", ctx.restaurantId)
      .single();

    if (checkError || !existingOrder) {
      console.error("Order check failed:", checkError?.message || "Order not found");
      return apiError("Commande non trouvée ou accès refusé", 404);
    }

    const { data, error } = await ctx.supabase
      .from("orders")
      .update(updateData as any)
      .eq("id", id)
      .eq("restaurant_id", ctx.restaurantId)
      .select()
      .single();

    if (error) {
      console.error("Update order error:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        orderId: id,
        restaurantId: ctx.restaurantId,
        updateData,
      });

      // Return detailed error message for debugging
      const errorMsg = error.message || "Erreur lors de la mise à jour";
      const details = error.details ? ` (${error.details})` : "";
      return apiError(`${errorMsg}${details}`);
    }

    // ── SMS notification on status change (fire-and-forget) ─────────────
    if (body.status && data) {
      const order = data as Record<string, unknown>;
      const customerPhone = String(order.customer_phone ?? "");

      if (customerPhone) {
        // Fetch restaurant settings for SMS config
        const { data: restaurantRaw } = await ctx.supabase
          .from("restaurants")
          .select("name, sms_notifications_enabled, notification_channels")
          .eq("id", ctx.restaurantId)
          .single();

        if (restaurantRaw) {
          const restaurant = restaurantRaw as Record<string, unknown>;
          const smsSettings: RestaurantSmsSettings = {
            sms_notifications_enabled: Boolean(restaurant.sms_notifications_enabled),
            notification_channels: restaurant.notification_channels,
          };

          // Fire-and-forget — don't await, don't block the response
          notifyOrderStatusChange(
            {
              status: body.status as NotifiableStatus,
              customerPhone,
              restaurantName: String(restaurant.name ?? "Restaurant"),
              orderRef: String(order.id ?? id),
              preparationTime: body.preparation_time_minutes
                ? Number(body.preparation_time_minutes)
                : undefined,
              cancelReason: body.cancel_reason
                ? String(body.cancel_reason)
                : undefined,
            },
            smsSettings
          ).catch(() => {
            // Silently ignore — logged inside the service
          });
        }
      }
    }

    // ── Push notifications (fire-and-forget) ────────────────────────
    if (data) {
      const order = data as Record<string, unknown>;
      const adminDb = createRawClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      // Fetch restaurant name for push messages
      const { data: restData } = await ctx.supabase
        .from("restaurants")
        .select("name")
        .eq("id", ctx.restaurantId)
        .single();

      const pushCtx = {
        orderId: id,
        orderRef: "",
        restaurantId: ctx.restaurantId,
        restaurantName: String((restData as any)?.name ?? "Restaurant"),
        customerId: (order.customer_id as string) ?? null,
        driverId: (order.driver_id as string) ?? null,
        total: Number(order.total ?? 0),
        deliveryType: String(order.delivery_type ?? ""),
      };

      // Push on status change
      if (body.status) {
        pushOrderStatusChange(adminDb, body.status, pushCtx).catch(() => {});
      }

      // Push when driver is newly assigned
      if (body.driver_id && body.driver_id !== null) {
        pushDriverAssigned(adminDb, String(body.driver_id), pushCtx).catch(() => {});
      }

      // Badge evaluation on order completion (fire-and-forget)
      if (body.status === "delivered" || body.status === "completed") {
        evaluateBadges(adminDb, ctx.restaurantId).catch(() => {});
      }
    }

    return NextResponse.json({ success: true, order: data });
  } catch (error) {
    console.error("PATCH /api/orders/[id] error:", error);
    return apiError("Erreur serveur");
  }
}
