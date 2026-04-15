import { createSupabaseClient } from "../_shared/supabase.ts";
import { sendFcmBatch } from "../_shared/fcm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action } = await req.json();
    const db = createSupabaseClient(req, true);

    if (action === "daily_summary") {
      await handleDailySummary(db);
    } else if (action === "inactive_customers") {
      await handleInactiveCustomers(db);
    } else if (action === "reservation_reminders") {
      await handleReservationReminders(db);
    } else {
      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[engagement-cron]", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ============================================================
// DAILY SUMMARY
// ============================================================
async function handleDailySummary(db: ReturnType<typeof createSupabaseClient>) {
  // Cameroon is UTC+1 (WAT)
  const now = new Date();
  const cameroonOffset = 1 * 60 * 60 * 1000;
  const cameroonNow = new Date(now.getTime() + cameroonOffset);
  const todayStr = cameroonNow.toISOString().slice(0, 10);
  const todayStart = `${todayStr}T00:00:00+01:00`;
  const todayEnd = `${todayStr}T23:59:59+01:00`;

  // Get all published restaurants
  const { data: restaurants } = await db
    .from("restaurants")
    .select("id, name, owner_id")
    .eq("is_published", true);

  if (!restaurants?.length) return;

  for (const rest of restaurants) {
    try {
      // Count today's paid orders
      const { data: todayOrders } = await db
        .from("orders")
        .select("id, total")
        .eq("restaurant_id", rest.id)
        .neq("status", "cancelled")
        .eq("payment_status", "paid")
        .gte("created_at", todayStart)
        .lte("created_at", todayEnd);

      const orderCount = todayOrders?.length ?? 0;
      const revenue = (todayOrders ?? []).reduce(
        (sum: number, o: { total: number }) => sum + (o.total ?? 0),
        0,
      );

      // Get historical best from restaurant_stats_daily
      const { data: bestDay } = await db
        .from("restaurant_stats_daily")
        .select("order_count")
        .eq("restaurant_id", rest.id)
        .order("order_count", { ascending: false })
        .limit(1)
        .maybeSingle();

      const previousBest = bestDay?.order_count ?? 0;
      const isRecord = orderCount > 0 && orderCount > previousBest;

      // Upsert today's stats
      await db.from("restaurant_stats_daily").upsert(
        {
          restaurant_id: rest.id,
          stat_date: todayStr,
          order_count: orderCount,
          revenue,
        },
        { onConflict: "restaurant_id,stat_date" },
      );

      // Build notification message
      const fmtRevenue = new Intl.NumberFormat("fr-FR").format(revenue);
      let title: string;
      let body: string;

      if (orderCount === 0) {
        title = "Bilan du jour";
        body = "Pas de commande aujourd'hui. Pensez a partager votre lien !";
      } else if (isRecord) {
        title = "Record battu !";
        body = `${orderCount} commandes aujourd'hui, ${fmtRevenue} FCFA de CA. Votre meilleur jour !`;
      } else {
        title = "Bilan du jour";
        body = `Aujourd'hui : ${orderCount} commandes, ${fmtRevenue} FCFA de CA.`;
      }

      // Insert restaurant notification
      await db.from("restaurant_notifications").insert({
        restaurant_id: rest.id,
        type: "daily_summary",
        title,
        body,
        payload: { order_count: orderCount, revenue, is_record: isRecord, date: todayStr },
      });

      // Send push to restaurant members
      await sendPushToRestaurantTokens(db, rest.id, rest.owner_id, title, body, {
        type: "daily_summary",
        restaurant_id: rest.id,
      });
    } catch (err) {
      console.error(`[daily_summary] Restaurant ${rest.id}:`, err);
    }
  }
}

// ============================================================
// INACTIVE CUSTOMERS
// ============================================================
async function handleInactiveCustomers(db: ReturnType<typeof createSupabaseClient>) {
  const { data: restaurants } = await db
    .from("restaurants")
    .select("id, name, owner_id")
    .eq("is_published", true);

  if (!restaurants?.length) return;

  for (const rest of restaurants) {
    try {
      // Find regular customers (2+ orders in 30 days) who haven't ordered in 7 days
      const { data: inactiveCustomers } = await db.rpc("find_inactive_regulars", {
        p_restaurant_id: rest.id,
        p_limit: 3,
      });

      // Fallback: raw query if RPC doesn't exist
      const customers = inactiveCustomers ?? await findInactiveRegularsManual(db, rest.id);

      if (!customers?.length) continue;

      for (const customer of customers) {
        const customerName = customer.full_name || "Un client regulier";
        const customerId = customer.customer_id;

        // Check if we already alerted for this customer in the last 7 days
        const { data: existing } = await db
          .from("restaurant_notifications")
          .select("id")
          .eq("restaurant_id", rest.id)
          .eq("type", "inactive_customer")
          .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .contains("payload", { customer_id: customerId })
          .limit(1);

        if (existing?.length) continue;

        const daysSince = Math.floor(
          (Date.now() - new Date(customer.last_order).getTime()) / (24 * 60 * 60 * 1000),
        );

        const title = "Client inactif";
        const body = `${customerName} n'a pas commande depuis ${daysSince} jours. Envoyez-lui une promo !`;

        await db.from("restaurant_notifications").insert({
          restaurant_id: rest.id,
          type: "inactive_customer",
          title,
          body,
          payload: {
            customer_id: customerId,
            customer_name: customerName,
            last_order: customer.last_order,
            days_since: daysSince,
          },
        });

        await sendPushToRestaurantTokens(db, rest.id, rest.owner_id, title, body, {
          type: "inactive_customer",
          restaurant_id: rest.id,
        });
      }
    } catch (err) {
      console.error(`[inactive_customers] Restaurant ${rest.id}:`, err);
    }
  }
}

async function findInactiveRegularsManual(
  db: ReturnType<typeof createSupabaseClient>,
  restaurantId: string,
) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Get customers with 2+ orders in last 30 days
  const { data: recentOrders } = await db
    .from("orders")
    .select("customer_id, created_at")
    .eq("restaurant_id", restaurantId)
    .not("customer_id", "is", null)
    .gte("created_at", thirtyDaysAgo)
    .order("created_at", { ascending: false });

  if (!recentOrders?.length) return [];

  // Group by customer
  const customerOrders = new Map<string, { count: number; lastOrder: string }>();
  for (const order of recentOrders) {
    const cid = order.customer_id as string;
    const existing = customerOrders.get(cid);
    if (existing) {
      existing.count++;
    } else {
      customerOrders.set(cid, { count: 1, lastOrder: order.created_at });
    }
  }

  // Filter: 2+ orders total but last order > 7 days ago
  const inactive: string[] = [];
  for (const [cid, info] of customerOrders) {
    if (info.count >= 2 && info.lastOrder < sevenDaysAgo) {
      inactive.push(cid);
      if (inactive.length >= 3) break;
    }
  }

  if (!inactive.length) return [];

  // Get customer names
  const { data: users } = await db
    .from("users")
    .select("id, full_name")
    .in("id", inactive);

  return inactive.map((cid) => {
    const user = (users ?? []).find((u: { id: string }) => u.id === cid);
    return {
      customer_id: cid,
      full_name: (user as { full_name?: string })?.full_name ?? null,
      last_order: customerOrders.get(cid)!.lastOrder,
    };
  });
}

// ============================================================
// RESERVATION REMINDERS
// ============================================================
async function handleReservationReminders(db: ReturnType<typeof createSupabaseClient>) {
  // Cameroon is UTC+1 (WAT)
  const now = new Date();
  const cameroonOffset = 1 * 60 * 60 * 1000;
  const cameroonNow = new Date(now.getTime() + cameroonOffset);

  // Calculate time windows
  const todayStr = cameroonNow.toISOString().slice(0, 10);
  const tomorrowStr = new Date(cameroonNow.getTime() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const currentTimeHHMM = cameroonNow.toISOString().slice(11, 16);

  // Window 1: Reservations TODAY, time in [now+45min, now+75min]
  const in45Min = new Date(cameroonNow.getTime() + 45 * 60 * 1000);
  const in75Min = new Date(cameroonNow.getTime() + 75 * 60 * 1000);
  const window1Start = in45Min.toISOString().slice(11, 16);
  const window1End = in75Min.toISOString().slice(11, 16);

  // Window 2: Reservations TOMORROW, time in [X, X+60min] where X is current time
  // (simplified: just check if reservation is tomorrow)
  const tomorrowWindowStart = cameroonNow.toISOString().slice(11, 16);
  const tomorrowWindowEnd = new Date(cameroonNow.getTime() + 60 * 60 * 1000)
    .toISOString()
    .slice(11, 16);

  // Get all published restaurants
  const { data: restaurants } = await db
    .from("restaurants")
    .select("id, name, owner_id")
    .eq("is_published", true);

  if (!restaurants?.length) return;

  for (const rest of restaurants) {
    try {
      // Find reservations in Window 1 (TODAY, next 45-75 min)
      const { data: window1Reservations } = await db
        .from("reservations")
        .select("id, reservation_date, reservation_time, customer_id, party_size, guest_name")
        .eq("restaurant_id", rest.id)
        .in("status", ["pending", "confirmed"])
        .eq("reservation_date", todayStr)
        .gte("reservation_time", window1Start)
        .lte("reservation_time", window1End);

      // Find reservations in Window 2 (TOMORROW, next 1h from now)
      const { data: window2Reservations } = await db
        .from("reservations")
        .select("id, reservation_date, reservation_time, customer_id, party_size, guest_name")
        .eq("restaurant_id", rest.id)
        .in("status", ["pending", "confirmed"])
        .eq("reservation_date", tomorrowStr)
        .gte("reservation_time", tomorrowWindowStart)
        .lte("reservation_time", tomorrowWindowEnd);

      const allReservations = [...(window1Reservations ?? []), ...(window2Reservations ?? [])];

      for (const reservation of allReservations) {
        try {
          const isWindow1 = window1Reservations?.some((r) => r.id === reservation.id);
          const windowLabel = isWindow1 ? "1h" : "24h";

          // Check if we already sent a reminder in last 2 hours
          const { data: existing } = await db
            .from("restaurant_notifications")
            .select("id")
            .eq("restaurant_id", rest.id)
            .eq("type", "reservation_reminder")
            .gte("created_at", new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
            .contains("payload", { reservation_id: reservation.id })
            .limit(1);

          if (existing?.length) continue;

          const timeStr = reservation.reservation_time;
          const partyInfo =
            reservation.party_size > 0
              ? `${reservation.party_size} personne${reservation.party_size > 1 ? "s" : ""}`
              : "invité(s)";

          // Build messages
          let restaurantTitle: string;
          let restaurantBody: string;
          let customerTitle: string;
          let customerBody: string;

          if (isWindow1) {
            restaurantTitle = "Réservation dans 1h";
            restaurantBody = `${reservation.guest_name} à ${timeStr} (${partyInfo})`;
            customerTitle = "Votre réservation arrive !";
            customerBody = `Vous êtes attendu à ${timeStr}. À bientôt !`;
          } else {
            restaurantTitle = "Réservation demain";
            restaurantBody = `${reservation.guest_name} à ${timeStr} (${partyInfo})`;
            customerTitle = "Rappel de réservation";
            customerBody = `Demain à ${timeStr}. On vous attend !`;
          }

          // Insert restaurant notification
          await db.from("restaurant_notifications").insert({
            restaurant_id: rest.id,
            type: "reservation_reminder",
            title: restaurantTitle,
            body: restaurantBody,
            payload: {
              reservation_id: reservation.id,
              guest_name: reservation.guest_name,
              party_size: reservation.party_size,
              time: timeStr,
              window: windowLabel,
            },
          });

          // Send push to restaurant members
          await sendPushToRestaurantTokens(rest.id, rest.owner_id, restaurantTitle, restaurantBody, {
            type: "reservation_reminder",
            restaurant_id: rest.id,
          });

          // Send push to customer if exists
          if (reservation.customer_id) {
            const { data: customerTokens } = await db
              .from("push_tokens")
              .select("token")
              .eq("user_id", reservation.customer_id);

            const tokens = (customerTokens ?? [])
              .map((r: { token: string }) => r.token)
              .filter(Boolean);

            if (tokens.length) {
              await sendFcmBatch(tokens, customerTitle, customerBody, {
                type: "reservation_reminder",
                reservation_id: reservation.id,
              }, "/stores/orders");
            }

            // Insert client notification
            await db.from("client_notifications").insert({
              user_id: reservation.customer_id,
              type: "reservation_reminder",
              title: customerTitle,
              body: customerBody,
              payload: {
                reservation_id: reservation.id,
                restaurant_name: rest.name,
                time: timeStr,
              },
            });
          }
        } catch (err) {
          console.error(`[reservation_reminders] Reservation ${reservation.id}:`, err);
        }
      }
    } catch (err) {
      console.error(`[reservation_reminders] Restaurant ${rest.id}:`, err);
    }
  }
}

// ============================================================
// SHARED: Send push to all restaurant tokens
// ============================================================
async function sendPushToRestaurantTokens(
  db: ReturnType<typeof createSupabaseClient>,
  restaurantId: string,
  ownerId: string,
  title: string,
  body: string,
  data: Record<string, string>,
) {
  try {
    // Get owner + active members
    const { data: members } = await db
      .from("restaurant_members")
      .select("user_id")
      .eq("restaurant_id", restaurantId)
      .eq("status", "active");

    const userIds = [
      ...new Set([ownerId, ...(members ?? []).map((m: { user_id: string }) => m.user_id)]),
    ].filter(Boolean);

    if (!userIds.length) return;

    const { data: tokenRows } = await db
      .from("push_tokens")
      .select("token")
      .in("user_id", userIds);

    const tokens = (tokenRows ?? [])
      .map((r: { token: string }) => r.token)
      .filter(Boolean);

    if (!tokens.length) return;

    await sendFcmBatch(tokens, title, body, data, "/dashboard");
  } catch (err) {
    console.error("[sendPushToRestaurantTokens]", err);
  }
}
