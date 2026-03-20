/**
 * Edge Function: kds-notify
 *
 * Two modes of operation:
 *
 * 1. **Webhook mode** (POST from Database Webhook on kds_notifications INSERT):
 *    Receives the new notification row and pushes it to relevant clients
 *    via Web Push API or other channels.
 *
 * 2. **Cron mode** (POST with { "action": "check_urgent" }):
 *    Calls check_and_notify_urgent_orders() to detect newly urgent orders,
 *    then processes any unprocessed notifications.
 *    Schedule this with Supabase cron: every 1 minute.
 *
 * The actual "sound" and "browser notification" remain client-side decisions.
 * This function handles:
 *  - Web Push notifications (if subscriptions are stored)
 *  - SMS alerts (if enabled on restaurant)
 *  - Marking notifications as processed
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createSupabaseClient } from "../_shared/supabase.ts";

interface WebhookPayload {
  type: "INSERT";
  table: string;
  record: {
    id: string;
    restaurant_id: string;
    order_id: string;
    event_type: string;
    payload: Record<string, unknown>;
    processed: boolean;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createSupabaseClient(undefined, true); // service_role
    const body = await req.json();

    // ── Cron mode: scan for urgent orders, then process queue ──
    if (body.action === "check_urgent") {
      // 1. Run the urgency check function
      const { data: urgentCount, error: rpcError } = await supabase.rpc(
        "check_and_notify_urgent_orders",
      );

      if (rpcError) {
        console.error("RPC check_and_notify_urgent_orders failed:", rpcError);
      } else {
        console.log(`Urgency check: ${urgentCount} new urgent orders detected`);
      }

      // 2. Process unprocessed notifications
      const processed = await processNotifications(supabase);

      // 3. Purge old notifications
      await supabase.rpc("purge_old_kds_notifications");

      return new Response(
        JSON.stringify({
          urgent_detected: urgentCount ?? 0,
          notifications_processed: processed,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Webhook mode: single notification from DB trigger ──
    const webhook = body as WebhookPayload;
    if (webhook.type === "INSERT" && webhook.record) {
      await sendNotification(supabase, webhook.record);

      // Mark as processed
      await supabase
        .from("kds_notifications")
        .update({ processed: true })
        .eq("id", webhook.record.id);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("kds-notify error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

// ── Process all unprocessed notifications ──────────────────────

async function processNotifications(
  supabase: ReturnType<typeof createSupabaseClient>,
): Promise<number> {
  const { data: notifications, error } = await supabase
    .from("kds_notifications")
    .select("*")
    .eq("processed", false)
    .order("created_at", { ascending: true })
    .limit(50);

  if (error || !notifications?.length) return 0;

  let processed = 0;
  for (const notification of notifications) {
    await sendNotification(supabase, notification);

    await supabase
      .from("kds_notifications")
      .update({ processed: true })
      .eq("id", notification.id);

    processed++;
  }

  return processed;
}

// ── Send a single notification via configured channels ─────────

async function sendNotification(
  supabase: ReturnType<typeof createSupabaseClient>,
  notification: {
    id: string;
    restaurant_id: string;
    order_id: string;
    event_type: string;
    payload: Record<string, unknown>;
  },
) {
  // Fetch restaurant settings for notification channels
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select(
      "name, phone, email, sms_notifications_enabled, notification_channels, owner_id",
    )
    .eq("id", notification.restaurant_id)
    .single();

  if (!restaurant) return;

  const channels: string[] =
    (restaurant.notification_channels as string[]) ?? ["email", "push"];

  const { event_type, payload } = notification;

  // Build notification message
  const orderId = ((payload.order_id as string) ?? "").slice(-6).toUpperCase();
  let title = "";
  let body = "";

  switch (event_type) {
    case "new_order":
      title = `Nouvelle commande #${orderId}`;
      body = `${payload.customer_name} - ${payload.delivery_type} - ${payload.items_count} article(s)`;
      break;
    case "order_urgent":
      title = `Commande #${orderId} en attente !`;
      body = `${payload.elapsed_minutes} minutes d'attente - ${payload.customer_name}`;
      break;
    case "status_changed":
      title = `Commande #${orderId} mise a jour`;
      body = `${payload.old_status} -> ${payload.new_status}`;
      break;
  }

  // ── SMS channel ──
  if (
    channels.includes("sms") &&
    restaurant.sms_notifications_enabled &&
    restaurant.phone &&
    event_type === "new_order"
  ) {
    try {
      // Replace with your SMS provider (Twilio, Africa's Talking, etc.)
      console.log(
        `[SMS] Would send to ${restaurant.phone}: ${title} - ${body}`,
      );
      // await fetch("https://api.twilio.com/...", { ... });
    } catch (err) {
      console.error("SMS send failed:", err);
    }
  }

  // ── Web Push channel ──
  // Web Push subscriptions would be stored in a separate table.
  // For now, the client subscribes to kds_notifications via Realtime
  // and handles sound/browser notifications locally.
  // This is the recommended pattern because:
  //   - Sound playback requires user gesture / AudioContext (browser-only)
  //   - Notification.permission is browser-only state
  //   - localStorage (kitchen_sound_enabled) is client-only
  if (channels.includes("push")) {
    console.log(`[PUSH] ${title}: ${body} (handled via Realtime subscription)`);
  }

  // ── Email channel (for urgent orders only) ──
  if (channels.includes("email") && event_type === "order_urgent") {
    try {
      console.log(
        `[EMAIL] Would send to ${restaurant.email}: ${title} - ${body}`,
      );
      // await fetch("https://api.resend.com/emails", { ... });
    } catch (err) {
      console.error("Email send failed:", err);
    }
  }
}
