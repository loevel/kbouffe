/**
 * Restaurant routes — migrated from web-dashboard/src/app/api/restaurant/
 *
 * GET   /restaurant   — Get authenticated merchant's restaurant
 * PATCH /restaurant   — Update restaurant info
 */
import { Hono } from "hono";
import type { Env, Variables } from "../../types";
import { parseBody } from "../../lib/body";

export const restaurantRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

const FIELD_MAP: Record<string, string> = {
    logoUrl: "logo_url",
    coverUrl: "banner_url",
    primaryColor: "primary_color",
    postalCode: "postal_code",
    cuisineType: "cuisine_type",
    priceRange: "price_range",
    isActive: "is_published",
    minOrderAmount: "min_order_amount",
    deliveryFee: "delivery_fee",
    openingHours: "opening_hours",
    hasDineIn: "has_dine_in",
    hasReservations: "has_reservations",
    corkageFeeAmount: "corkage_fee_amount",
    dineInServiceFee: "dine_in_service_fee",
    totalTables: "total_tables",
    reservationCancelPolicy: "reservation_cancel_policy",
    reservationCancelNoticeMinutes: "reservation_cancel_notice_minutes",
    reservationCancellationFeeAmount: "reservation_cancellation_fee_amount",
    orderCancelPolicy: "order_cancel_policy",
    orderCancelNoticeMinutes: "order_cancel_notice_minutes",
    orderCancellationFeeAmount: "order_cancellation_fee_amount",
    paymentMethods: "payment_methods",
    paymentCredentials: "payment_credentials",
    smsNotificationsEnabled: "sms_notifications_enabled",
    notificationChannels: "notification_channels",
    deliveryZones: "delivery_zones",
    deliveryBaseFee: "delivery_base_fee",
    deliveryPerKmFee: "delivery_per_km_fee",
    maxDeliveryRadiusKm: "max_delivery_radius_km",
    notificationInfo: "notification_info",
    metaPixelId: "meta_pixel_id",
    googleAnalyticsId: "google_analytics_id",
    themeLayout: "theme_layout",
    onboardingCompleted: "onboarding_completed",
    descriptionI18n: "description_i18n",
};

const ALLOWED_FIELDS = new Set([
    "name", "description", "address", "city", "country", "slug", "phone", "email", "lat", "lng",
    "logo_url", "banner_url", "primary_color", "postal_code", "cuisine_type", "price_range",
    "is_published", "min_order_amount", "delivery_fee", "opening_hours", "has_dine_in",
    "has_reservations", "corkage_fee_amount", "dine_in_service_fee", "total_tables",
    "reservation_cancel_policy", "reservation_cancel_notice_minutes", "reservation_cancellation_fee_amount",
    "order_cancel_policy", "order_cancel_notice_minutes", "order_cancellation_fee_amount",
    "payment_methods", "payment_credentials", "sms_notifications_enabled", "notification_channels",
    "delivery_zones", "delivery_base_fee", "delivery_per_km_fee", "max_delivery_radius_km",
    "notification_info", "meta_pixel_id", "google_analytics_id", "theme_layout",
    "onboarding_completed", "description_i18n",
]);

const GA4_REGEX = /^G-[A-Z0-9]{4,20}$/;
const META_PIXEL_REGEX = /^\d{10,20}$/;

/** GET /restaurant — Get the merchant's restaurant */
restaurantRoutes.get("/", async (c) => {
    const restaurantId = c.var.restaurantId;
    const supabase = c.var.supabase;

    const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", restaurantId)
        .single();

    if (error || !data) {
        return c.json({ error: "Restaurant not found" }, 404);
    }

    return c.json({ success: true, id: data.id, restaurant: data });
});

/** PATCH /restaurant — Update restaurant info (accepts camelCase or snake_case fields) */
restaurantRoutes.patch("/", async (c) => {
    const restaurantId = c.var.restaurantId;
    const supabase = c.var.supabase;

    const body = await parseBody(c);
    if (!body) return c.json({ error: "Corps de la requête invalide" }, 400);

    // Validate tracking IDs before storing (SEC-004: prevent XSS via dangerouslySetInnerHTML)
    const gaId = body.googleAnalyticsId ?? body.google_analytics_id;
    const pixelId = body.metaPixelId ?? body.meta_pixel_id;
    if (gaId !== undefined && gaId !== null && gaId !== "" && !GA4_REGEX.test(String(gaId))) {
        return c.json({ error: "ID Google Analytics invalide (format attendu : G-XXXXXXXXXX)" }, 400);
    }
    if (pixelId !== undefined && pixelId !== null && pixelId !== "" && !META_PIXEL_REGEX.test(String(pixelId))) {
        return c.json({ error: "ID Meta Pixel invalide (format attendu : 10 à 20 chiffres)" }, 400);
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    for (const [key, value] of Object.entries(body)) {
        const snakeKey = FIELD_MAP[key] ?? key;
        if (ALLOWED_FIELDS.has(snakeKey)) {
            updateData[snakeKey] = value;
        }
    }

    const { data, error } = await supabase
        .from("restaurants")
        .update(updateData)
        .eq("id", restaurantId)
        .select()
        .single();

    if (error || !data) {
        return c.json({ error: "Failed to update restaurant" }, 500);
    }

    return c.json({ success: true, restaurant: data });
});

/** GET /restaurant/activity — Activity feed (orders + reviews + messages) */
restaurantRoutes.get("/activity", async (c) => {
    const restaurantId = c.var.restaurantId;
    const supabase = c.var.supabase;

    const days7Ago = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [ordersRes, reviewsRes, messagesRes] = await Promise.all([
        supabase
            .from("orders")
            .select("id, status, customer_name, total, created_at")
            .eq("restaurant_id", restaurantId)
            .gte("created_at", days7Ago)
            .order("created_at", { ascending: false })
            .limit(10),
        supabase
            .from("reviews")
            .select("id, rating, comment, created_at, user_id")
            .eq("restaurant_id", restaurantId)
            .gte("created_at", days7Ago)
            .order("created_at", { ascending: false })
            .limit(10),
        supabase
            .from("messages")
            .select("id, content, created_at, sender_id")
            .eq("restaurant_id", restaurantId)
            .gte("created_at", days7Ago)
            .order("created_at", { ascending: false })
            .limit(10),
    ]);

    type Event = { type: string; id: string; title: string; subtitle?: string; timestamp: string };
    const events: Event[] = [];

    for (const o of ordersRes.data ?? []) {
        events.push({
            type: "order_new",
            id: o.id as string,
            title: `Commande #${(o.id as string).slice(-6).toUpperCase()}`,
            subtitle: `${o.customer_name ?? "Client"} — ${(o.total as number)?.toLocaleString("fr-FR")} FCFA`,
            timestamp: o.created_at as string,
        });
    }
    for (const r of reviewsRes.data ?? []) {
        events.push({
            type: "review_new",
            id: r.id as string,
            title: `Nouvel avis (${r.rating as number}★)`,
            subtitle: r.comment as string | undefined,
            timestamp: r.created_at as string,
        });
    }
    for (const m of messagesRes.data ?? []) {
        events.push({
            type: "message_new",
            id: m.id as string,
            title: "Nouveau message",
            subtitle: m.content as string | undefined,
            timestamp: m.created_at as string,
        });
    }

    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return c.json({ events: events.slice(0, 15) });
});

/** GET /restaurant/badges — Count of pending orders, unread messages, reviews needing reply */
restaurantRoutes.get("/badges", async (c) => {
    const restaurantId = c.var.restaurantId;
    const supabase = c.var.supabase;

    const [ordersRes, msgsRes, reviewsRes] = await Promise.all([
        supabase
            .from("orders")
            .select("id", { count: "exact" })
            .eq("restaurant_id", restaurantId)
            .in("status", ["pending", "confirmed"]),
        supabase
            .from("messages")
            .select("id", { count: "exact" })
            .in("is_read", [false])
            .neq("sender_id", c.var.userId),
        supabase
            .from("reviews")
            .select("id", { count: "exact" })
            .eq("restaurant_id", restaurantId)
            .is("reply", null),
    ]);

    return c.json({
        orders: ordersRes.count ?? 0,
        messages: msgsRes.count ?? 0,
        reviews: reviewsRes.count ?? 0,
    });
});

/** GET /restaurant/search?q=... — Global quick search across orders, products, customers */
restaurantRoutes.get("/search", async (c) => {
    const restaurantId = c.var.restaurantId;
    // Strip leading # so "#A3F2C1" and "A3F2C1" both work
    const q = (c.req.query("q") ?? "").trim().replace(/^#/, "");
    const supabase = c.var.supabase;

    if (q.length < 2) return c.json({ results: [] });

    const [ordersRes, productsRes, customersRes] = await Promise.all([
        // Orders: search by customer_name, customer_phone, or last 6 chars of UUID cast to text
        supabase
            .from("orders")
            .select("id, status, total, customer_name, customer_phone, created_at")
            .eq("restaurant_id", restaurantId)
            .or(`customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%`)
            .order("created_at", { ascending: false })
            .limit(5),
        supabase
            .from("products")
            .select("id, name, price, category_id")
            .eq("restaurant_id", restaurantId)
            .ilike("name", `%${q}%`)
            .limit(5),
        // Customers scoped to this restaurant via orders (distinct by customer_id)
        supabase
            .from("orders")
            .select("customer_id, customer_name, customer_phone")
            .eq("restaurant_id", restaurantId)
            .or(`customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%`)
            .not("customer_id", "is", null)
            .limit(10),
    ]);

    type SearchResult = { type: "order" | "product" | "customer"; id: string; title: string; subtitle?: string; href: string };
    const results: SearchResult[] = [];

    for (const o of ordersRes.data ?? []) {
        const shortId = (o.id as string).slice(-6).toUpperCase();
        results.push({
            type: "order",
            id: o.id as string,
            title: `Commande #${shortId}`,
            subtitle: `${o.customer_name ?? "Client"} — ${(o.total as number)?.toLocaleString("fr-FR")} FCFA`,
            href: `/dashboard/orders?highlight=${o.id}`,
        });
    }
    for (const p of productsRes.data ?? []) {
        results.push({
            type: "product",
            id: p.id as string,
            title: p.name as string,
            subtitle: `${(p.price as number)?.toLocaleString("fr-FR")} FCFA`,
            href: `/dashboard/menu?highlight=${p.id}`,
        });
    }

    // Deduplicate customers by customer_id
    const seenCustomers = new Set<string>();
    for (const row of customersRes.data ?? []) {
        const cid = row.customer_id as string;
        if (!seenCustomers.has(cid)) {
            seenCustomers.add(cid);
            results.push({
                type: "customer",
                id: cid,
                title: (row.customer_name ?? "Client inconnu") as string,
                subtitle: (row.customer_phone ?? undefined) as string | undefined,
                href: `/dashboard/customers?id=${cid}`,
            });
        }
        if (seenCustomers.size >= 3) break;
    }

    return c.json({ results: results.slice(0, 10) });
});

/** GET /restaurant/branding — Get branding settings */
restaurantRoutes.get("/branding", async (c) => {
    const restaurantId = c.var.restaurantId;
    const supabase = c.var.supabase;

    const { data, error } = await supabase
        .from("restaurants")
        .select("primary_color, secondary_color, logo_url, banner_url, theme_layout")
        .eq("id", restaurantId)
        .single();

    if (error || !data) {
        return c.json({ error: "Restaurant not found" }, 404);
    }

    return c.json(data);
});

/** PATCH /restaurant/branding — Update branding settings */
restaurantRoutes.patch("/branding", async (c) => {
    const restaurantId = c.var.restaurantId;
    const supabase = c.var.supabase;

    const body = await parseBody(c);
    if (!body) return c.json({ error: "Corps de la requête invalide" }, 400);

    const { data, error } = await supabase
        .from("restaurants")
        .update({
            primary_color: body.primary_color,
            secondary_color: body.secondary_color,
            logo_url: body.logo_url,
            banner_url: body.banner_url,
            theme_layout: body.theme_layout,
        })
        .eq("id", restaurantId)
        .select("primary_color, secondary_color, logo_url, banner_url, theme_layout")
        .single();

    if (error || !data) {
        return c.json({ error: "Failed to update branding" }, 500);
    }

    return c.json(data);
});

/** GET /restaurant/dine-in — Get dine-in settings */
restaurantRoutes.get("/dine-in", async (c) => {
    const restaurantId = c.var.restaurantId;
    const supabase = c.var.supabase;

    const { data, error } = await supabase
        .from("restaurants")
        .select("has_dine_in, dine_in_service_fee, total_tables, settings")
        .eq("id", restaurantId)
        .single();

    if (error || !data) {
        return c.json({ error: "Restaurant not found" }, 404);
    }

    const settings = data.settings || {};
    return c.json({
        has_dine_in: data.has_dine_in,
        dine_in_service_fee: data.dine_in_service_fee,
        total_tables: data.total_tables,
        qr_code_enabled: settings.qr_code_enabled ?? false,
        table_numbering_enabled: settings.table_numbering_enabled ?? false,
    });
});

/** PATCH /restaurant/dine-in — Update dine-in settings */
restaurantRoutes.patch("/dine-in", async (c) => {
    const restaurantId = c.var.restaurantId;
    const supabase = c.var.supabase;

    const body = await parseBody(c);
    if (!body) return c.json({ error: "Corps de la requête invalide" }, 400);

    // First get current settings to merge
    const { data: current } = await supabase
        .from("restaurants")
        .select("settings")
        .eq("id", restaurantId)
        .single();

    const settings = current?.settings || {};
    if (body.qr_code_enabled !== undefined) settings.qr_code_enabled = body.qr_code_enabled;
    if (body.table_numbering_enabled !== undefined) settings.table_numbering_enabled = body.table_numbering_enabled;

    const { data, error } = await supabase
        .from("restaurants")
        .update({
            has_dine_in: body.has_dine_in,
            dine_in_service_fee: body.dine_in_service_fee,
            total_tables: body.total_tables,
            settings,
        })
        .eq("id", restaurantId)
        .select("has_dine_in, dine_in_service_fee, total_tables, settings")
        .single();

    if (error || !data) {
        return c.json({ error: "Failed to update dine-in settings" }, 500);
    }

    const updatedSettings = data.settings || {};
    return c.json({
        has_dine_in: data.has_dine_in,
        dine_in_service_fee: data.dine_in_service_fee,
        total_tables: data.total_tables,
        qr_code_enabled: updatedSettings.qr_code_enabled ?? false,
        table_numbering_enabled: updatedSettings.table_numbering_enabled ?? false,
    });
});

/** GET /restaurant/showcase — Get showcase/vitrine data */
restaurantRoutes.get("/showcase", async (c) => {
    const restaurantId = c.var.restaurantId;
    const supabase = c.var.supabase;

    const { data, error } = await supabase
        .from("restaurants")
        .select("description, social_links, website")
        .eq("id", restaurantId)
        .single();

    if (error || !data) {
        return c.json({ error: "Restaurant not found" }, 404);
    }

    return c.json(data);
});

/** PATCH /restaurant/showcase — Update showcase/vitrine data */
restaurantRoutes.patch("/showcase", async (c) => {
    const restaurantId = c.var.restaurantId;
    const supabase = c.var.supabase;

    const body = await parseBody(c);
    if (!body) return c.json({ error: "Corps de la requête invalide" }, 400);

    const { data, error } = await supabase
        .from("restaurants")
        .update({
            description: body.description,
            social_links: body.social_links,
            website: body.website,
        })
        .eq("id", restaurantId)
        .select("description, social_links, website")
        .single();

    if (error || !data) {
        return c.json({ error: "Failed to update showcase" }, 500);
    }

    return c.json(data);
});

/** GET /restaurant/gallery — Get restaurant photos */
restaurantRoutes.get("/gallery", async (c) => {
    const restaurantId = c.var.restaurantId;
    const supabase = c.var.supabase;

    const { data, error } = await supabase
        .from("restaurant_photos")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("display_order", { ascending: true });

    if (error) {
        return c.json({ error: "Failed to fetch photos" }, 500);
    }

    return c.json({ photos: data || [] });
});

/** DELETE /restaurant/gallery/:id — Delete a restaurant photo */
restaurantRoutes.delete("/gallery/:id", async (c) => {
    const restaurantId = c.var.restaurantId;
    const photoId = c.req.param("id");
    const supabase = c.var.supabase;

    // Verify the photo belongs to this restaurant before deleting
    const { data: photo, error: fetchError } = await supabase
        .from("restaurant_photos")
        .select("id")
        .eq("id", photoId)
        .eq("restaurant_id", restaurantId)
        .single();

    if (fetchError || !photo) {
        return c.json({ error: "Photo not found" }, 404);
    }

    const { error: deleteError } = await supabase
        .from("restaurant_photos")
        .delete()
        .eq("id", photoId)
        .eq("restaurant_id", restaurantId);

    if (deleteError) {
        return c.json({ error: "Failed to delete photo" }, 500);
    }

    return c.json({ success: true });
});
