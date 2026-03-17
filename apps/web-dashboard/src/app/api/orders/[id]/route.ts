/**
 * GET    /api/orders/[id] — Get a single order
 * PATCH  /api/orders/[id] — Update order status / notes
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";
import { notifyOrderStatusChange, type NotifiableStatus, type RestaurantSmsSettings } from "@/lib/sms/service";

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

    const { data, error } = await ctx.supabase
      .from("orders")
      // @ts-expect-error — Supabase types infer never for ungenerated schema
      .update(updateData as any)
      .eq("id", id)
      .eq("restaurant_id", ctx.restaurantId)
      .select()
      .single();

    if (error) {
      console.error("Update order error:", error);
      return apiError("Erreur lors de la mise à jour");
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

    return NextResponse.json({ success: true, order: data });
  } catch (error) {
    console.error("PATCH /api/orders/[id] error:", error);
    return apiError("Erreur serveur");
  }
}
