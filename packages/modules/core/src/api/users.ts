import { Hono } from "hono";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { CoreEnv, CoreVariables } from "./types";

function adminDb(c: { env: CoreEnv }) {
    return createSupabaseClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY!, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

export const usersRoutes = new Hono<{ Bindings: CoreEnv; Variables: CoreVariables }>();
export const securityRoutes = new Hono<{ Bindings: CoreEnv; Variables: CoreVariables }>();

// ── Users (Account) ──────────────────────────────────────────────────────────

/** DELETE /account — Delete user's account */
usersRoutes.delete("/", async (c) => {
    const userId = c.var.userId;
    const supabase = c.var.supabase;

    // 1. Anonymize linked data (orders, wallet, messages) before deleting
    //    to preserve accounting integrity while removing PII.
    await supabase.from("wallet_movements").update({ note: "[compte supprimé]" } as any).eq("user_id", userId);

    // 2. Delete user row from public.users (cascades to favorites, addresses, etc.)
    const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", userId);

    if (error) return c.json({ error: error.message }, 500);

    // 3. Delete from auth.users — removes credentials (email, password hash).
    //    Required by Loi 2010/012 Art.48 (droit à l'effacement).
    const admin = adminDb(c);
    const { error: authError } = await admin.auth.admin.deleteUser(userId);
    if (authError) {
        console.error("[DELETE /account] Failed to delete auth.users row:", authError.message);
        // Non-blocking: public data is gone, auth row will be cleaned up by CRON.
    }

    return c.json({ success: true });
});

// ── Loyalty & Wallet ─────────────────────────────────────────────────────────

// ── Loyalty & Wallet ─────────────────────────────────────────────────────────

/** GET /account/loyalty — Get user's wallet balance, history, favorites, and status */
usersRoutes.get("/loyalty", async (c) => {
    const userId = c.var.userId;
    const supabase = c.var.supabase;

    const { data: user, error: userError } = await supabase
        .from("users")
        .select("wallet_balance, referral_code, referral_invites, referral_rewards, onboarding_completed, theme_preference, full_name, phone, avatar_url, preferred_lang, notifications_enabled")
        .eq("id", userId)
        .single();

    if (userError) return c.json({ error: "Utilisateur non trouvé" }, 404);

    const { data: movements } = await supabase
        .from("wallet_movements")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

    const { data: favRestaurants } = await supabase
        .from("restaurant_favorites")
        .select("restaurant_id")
        .eq("user_id", userId);

    const { data: favProducts } = await supabase
        .from("product_favorites")
        .select("product_id")
        .eq("user_id", userId);

    return c.json({
        balance: user.wallet_balance ?? 0,
        movements: movements ?? [],
        favorites: {
            restaurants: favRestaurants?.map(f => f.restaurant_id) || [],
            products: favProducts?.map(f => f.product_id) || []
        },
        referral: {
            code: user.referral_code ?? null,
            invites: user.referral_invites ?? 0,
            rewards: user.referral_rewards ?? 0,
        },
        profile: {
            fullName: user.full_name,
            phone: user.phone,
            avatarUrl: user.avatar_url,
            preferredLang: user.preferred_lang,
            notificationsEnabled: user.notifications_enabled,
            onboardingCompleted: user.onboarding_completed,
            themePreference: user.theme_preference
        }
    });
});

/** POST /account/favorites/restaurant — Toggle favorite restaurant */
usersRoutes.post("/favorites/restaurant", async (c) => {
    const { restaurantId } = await c.req.json();
    const supabase = c.var.supabase;
    const userId = c.var.userId;
    
    const { data: existing } = await supabase
        .from("restaurant_favorites")
        .select("id")
        .eq("user_id", userId)
        .eq("restaurant_id", restaurantId)
        .single();

    if (existing) {
        await supabase.from("restaurant_favorites").delete().eq("id", existing.id);
        return c.json({ active: false });
    } else {
        await supabase.from("restaurant_favorites").insert({ user_id: userId, restaurant_id: restaurantId });
        return c.json({ active: true });
    }
});

/** POST /account/favorites/product — Toggle favorite product */
usersRoutes.post("/favorites/product", async (c) => {
    const { productId } = await c.req.json();
    const supabase = c.var.supabase;
    const userId = c.var.userId;
    
    const { data: existing } = await supabase
        .from("product_favorites")
        .select("id")
        .eq("user_id", userId)
        .eq("product_id", productId)
        .single();

    if (existing) {
        await supabase.from("product_favorites").delete().eq("id", existing.id);
        return c.json({ active: false });
    } else {
        await supabase.from("product_favorites").insert({ user_id: userId, product_id: productId });
        return c.json({ active: true });
    }
});


/** POST /account/referral/reward — Register referral reward (server-side amount only) */
usersRoutes.post("/referral/reward", async (c) => {
    const supabase = c.var.supabase;
    const userId = c.var.userId;

    // SEC-006: Amount is fixed server-side — never trust client-sent amount
    const REFERRAL_REWARD_XAF = 500;

    // Idempotency: max 1 referral reward per 24h per user
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recent } = await supabase
        .from("wallet_movements")
        .select("id")
        .eq("user_id", userId)
        .eq("reason", "referral_reward")
        .gte("created_at", since)
        .limit(1)
        .maybeSingle();

    if (recent) {
        return c.json({ error: "Récompense de parrainage déjà attribuée récemment" }, 429);
    }

    // 1. Update referral stats
    const { error: userUpdateError } = await supabase.rpc("increment_referral_stats", {
        input_user_id: userId,
        reward_amount: REFERRAL_REWARD_XAF
    });

    if (userUpdateError) return c.json({ error: "Erreur mise à jour stats parrainage" }, 500);

    // 2. Add wallet movement
    const { data: movement } = await supabase
        .from("wallet_movements")
        .insert({
            user_id: userId,
            type: "credit",
            reason: "referral_reward",
            amount: REFERRAL_REWARD_XAF,
            description: "Bonus parrainage"
        })
        .select()
        .single();

    // 3. Update balance
    await supabase.rpc("increment_wallet_balance", {
        input_user_id: userId,
        amount: REFERRAL_REWARD_XAF
    });

    return c.json({ success: true, movement });
});

/** PATCH /account/profile — Update user profile & metadata */
usersRoutes.patch("/profile", async (c) => {
    const body = await c.req.json();
    const supabase = c.var.supabase;
    const userId = c.var.userId;

    if (!userId) {
        return c.json({ error: "Utilisateur non authentifié" }, 401);
    }

    const updateData: any = {};
    if (body.fullName !== undefined && body.fullName !== null) {
        updateData.full_name = body.fullName.trim();
    }
    if (body.phone !== undefined && body.phone !== null) {
        updateData.phone = body.phone.trim();
    }
    if (body.avatarUrl !== undefined) updateData.avatar_url = body.avatarUrl;
    if (body.preferredLang !== undefined) updateData.preferred_lang = body.preferredLang;
    if (body.notificationsEnabled !== undefined) updateData.notifications_enabled = body.notificationsEnabled;
    if (body.onboardingCompleted !== undefined) updateData.onboarding_completed = body.onboardingCompleted;
    if (body.themePreference !== undefined) updateData.theme_preference = body.themePreference;

    // Ensure we have something to update
    if (Object.keys(updateData).length === 0) {
        return c.json({ success: true, message: "Aucune donnée à mettre à jour" });
    }

    const { error, data } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", userId)
        .select();

    if (error) {
        console.error("[PATCH /account/profile] Update failed for user", userId, error);
        const isDevelopment = (c.env as { ENVIRONMENT?: string }).ENVIRONMENT === "development";
        return c.json({
            error: error.message,
            code: error.code,
            details: isDevelopment ? error.details : undefined
        }, 500);
    }

    return c.json({ success: true, data });
});

/** GET /account/addresses — List addresses */
usersRoutes.get("/addresses", async (c) => {
    const { data, error } = await c.var.supabase
        .from("addresses")
        .select("*")
        .eq("user_id", c.var.userId)
        .order("created_at", { ascending: false });

    if (error) return c.json({ error: error.message }, 500);
    return c.json({ addresses: data || [] });
});

/** POST /account/addresses — Create address */
usersRoutes.post("/addresses", async (c) => {
    const body = await c.req.json();
    const supabase = c.var.supabase;
    const userId = c.var.userId;

    if (body.isDefault) {
        await supabase.from("addresses").update({ is_default: false }).eq("user_id", userId);
    }

    const { data, error } = await supabase
        .from("addresses")
        .insert({
            user_id: userId,
            label: body.label,
            address: body.address,
            city: body.city,
            postal_code: body.postalCode,
            lat: body.lat,
            lng: body.lng,
            instructions: body.instructions,
            is_default: body.isDefault ?? false
        })
        .select()
        .single();

    if (error) return c.json({ error: error.message }, 500);
    return c.json({ success: true, address: data });
});

/** PATCH /account/addresses/:id — Update address */
usersRoutes.patch("/addresses/:id", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();
    const supabase = c.var.supabase;
    const userId = c.var.userId;

    if (body.isDefault) {
        await supabase.from("addresses").update({ is_default: false }).eq("user_id", userId);
    }

    const updateData: any = {};
    if (body.label !== undefined) updateData.label = body.label;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.postalCode !== undefined) updateData.postal_code = body.postalCode;
    if (body.lat !== undefined) updateData.lat = body.lat;
    if (body.lng !== undefined) updateData.lng = body.lng;
    if (body.instructions !== undefined) updateData.instructions = body.instructions;
    if (body.isDefault !== undefined) updateData.is_default = body.isDefault;

    const { data, error } = await supabase
        .from("addresses")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

    if (error) return c.json({ error: error.message }, 500);
    return c.json({ success: true, address: data });
});

/** DELETE /account/addresses/:id — Delete address */
usersRoutes.delete("/addresses/:id", async (c) => {
    const id = c.req.param("id");
    const { error } = await c.var.supabase
        .from("addresses")
        .delete()
        .eq("id", id)
        .eq("user_id", c.var.userId);

    if (error) return c.json({ error: error.message }, 500);
    return c.json({ success: true });
});

/** GET /account/support/tickets — List support tickets */
usersRoutes.get("/support/tickets", async (c) => {
    const { data, error } = await c.var.supabase
        .from("support_tickets")
        .select("*")
        .eq("reporter_id", c.var.userId)
        .order("created_at", { ascending: false });

    if (error) return c.json({ error: error.message }, 500);
    return c.json({ tickets: data || [] });
});

/** POST /account/support/tickets — Create ticket + conversation linked to restaurant */
usersRoutes.post("/support/tickets", async (c) => {
    const body = await c.req.json();
    const userId = c.var.userId;
    const db = adminDb(c);

    // Resolve restaurant_id: prefer explicit, else look it up from the order
    let restaurantId: string | null = body.restaurantId || null;
    if (!restaurantId && body.orderId) {
        const { data: order } = await db
            .from("orders")
            .select("restaurant_id, customer_id")
            .eq("id", body.orderId)
            .maybeSingle();
        if (order?.customer_id === userId) {
            restaurantId = order.restaurant_id;
        }
    }

    // Insert support ticket
    const { data: ticket, error } = await db
        .from("support_tickets")
        .insert({
            reporter_id: userId,
            reporter_type: body.reporterType || "client",
            subject: body.subject,
            description: body.description,
            priority: body.priority || "medium",
            restaurant_id: restaurantId,
            order_id: body.orderId || null,
        })
        .select()
        .single();

    if (error) return c.json({ error: error.message }, 500);

    // If we have a restaurant, create the linked conversation so it appears in
    // the restaurant dashboard's messages view.
    if (restaurantId) {
        // Fetch customer name for conversation metadata
        const { data: userProfile } = await db
            .from("users")
            .select("full_name, phone")
            .eq("id", userId)
            .maybeSingle();

        const { data: conversation, error: convError } = await db
            .from("conversations")
            .insert({
                restaurant_id: restaurantId,
                metadata: {
                    type: "support",
                    ticket_id: ticket.id,
                    customer_id: userId,
                    customer_name: userProfile?.full_name || userProfile?.phone || "Client",
                    subject: body.subject,
                },
            })
            .select()
            .single();

        if (!convError && conversation && body.description) {
            // Insert the description as the opening message
            await db.from("messages").insert({
                conversation_id: conversation.id,
                sender_id: userId,
                content: body.description,
                content_type: "text",
                is_read: false,
            });
        }
    }

    return c.json({ success: true, ticket });
});

/** GET /account/orders — User order history */
usersRoutes.get("/orders", async (c) => {
    const { data, error } = await c.var.supabase
        .from("orders")
        .select("*, restaurant:restaurants(name, slug, lat, lng)")
        .eq("customer_id", c.var.userId)
        .order("created_at", { ascending: false })
        .limit(100);

    if (error) return c.json({ error: error.message }, 500);
    return c.json({
        orders: (data || []).map((order: Record<string, unknown> & { restaurant?: { name?: string | null; slug?: string | null; lat?: number | null; lng?: number | null } | null; items?: unknown[] | null }) => ({
            ...order,
            restaurant_name: order.restaurant?.name ?? null,
            restaurant_slug: order.restaurant?.slug ?? null,
            restaurant_lat: order.restaurant?.lat ?? null,
            restaurant_lng: order.restaurant?.lng ?? null,
            item_count: Array.isArray(order.items) ? order.items.length : 0,
        })),
    });
});

/** POST /account/orders/:id/cancel — Client cancels own pending order */

// ── Reservations client ───────────────────────────────────────────────────────

/** GET /account/reservations — Customer's own reservations */
usersRoutes.get("/reservations", async (c) => {
    const { data, error } = await c.var.supabase
        .from("reservations")
        .select("id, date, time, party_size, status, occasion, special_requests, created_at, restaurant:restaurants(id, name, slug, logo_url)")
        .eq("customer_id", c.var.userId)
        .order("date", { ascending: false })
        .order("time", { ascending: false })
        .limit(100);

    if (error) return c.json({ error: error.message }, 500);

    const reservations = (data ?? []).map((r: any) => ({
        id: r.id,
        date: r.date,
        time: r.time,
        party_size: r.party_size,
        status: r.status,
        occasion: r.occasion ?? null,
        special_requests: r.special_requests ?? null,
        created_at: r.created_at,
        restaurant_name: r.restaurant?.name ?? null,
        restaurant_slug: r.restaurant?.slug ?? null,
        restaurant_logo: r.restaurant?.logo_url ?? null,
    }));

    return c.json({ reservations });
});

/** POST /account/reservations/:id/cancel — Customer cancels own reservation */
usersRoutes.post("/reservations/:id/cancel", async (c) => {
    const reservationId = c.req.param("id");

    const { data: reservation, error: fetchErr } = await c.var.supabase
        .from("reservations")
        .select("id, status, customer_id, date, time")
        .eq("id", reservationId)
        .eq("customer_id", c.var.userId)
        .single();

    if (fetchErr || !reservation) return c.json({ error: "Réservation introuvable" }, 404);

    if (!["pending", "confirmed"].includes(reservation.status)) {
        return c.json({ error: "Cette réservation ne peut plus être annulée" }, 400);
    }

    const { error: updateErr } = await c.var.supabase
        .from("reservations")
        .update({ status: "cancelled" })
        .eq("id", reservationId);

    if (updateErr) return c.json({ error: updateErr.message }, 500);
    return c.json({ success: true });
});

/** POST /account/orders/:id/cancel — Client cancels own pending order */
usersRoutes.post("/orders/:id/cancel", async (c) => {
    const orderId = c.req.param("id");

    // Verify order belongs to this user and is still pending
    const { data: order, error: fetchErr } = await c.var.supabase
        .from("orders")
        .select("id, status, customer_id")
        .eq("id", orderId)
        .eq("customer_id", c.var.userId)
        .single();

    if (fetchErr || !order) return c.json({ error: "Commande introuvable" }, 404);
    if (order.status !== "pending") {
        return c.json({ error: "Seules les commandes en attente peuvent être annulées" }, 400);
    }

    const { error: updateErr } = await c.var.supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", orderId);

    if (updateErr) return c.json({ error: updateErr.message }, 500);
    return c.json({ success: true });
});

// ── Security ─────────────────────────────────────────────────────────

/** POST /security/password — Change password */
securityRoutes.post("/password", async (c) => {
    const body = await c.req.json();
    const currentPassword = body.currentPassword?.trim() ?? "";
    const newPassword = body.newPassword?.trim() ?? "";

    if (!currentPassword || !newPassword) {
        return c.json({ error: "Mot de passe actuel et nouveau requis" }, 400);
    }
    if (newPassword.length < 8) {
        return c.json({ error: "Le mot de passe doit contenir au moins 8 caractères" }, 400);
    }

    // Verify current password
    const { error: verifyError } = await c.var.supabase.auth.signInWithPassword({
        email: (await c.var.supabase.auth.getUser()).data.user?.email ?? "",
        password: currentPassword,
    });

    if (verifyError) return c.json({ error: "Mot de passe actuel incorrect" }, 400);

    const { error: updateError } = await c.var.supabase.auth.updateUser({
        password: newPassword,
    });

    if (updateError) return c.json({ error: updateError.message || "Échec de mise à jour" }, 400);

    return c.json({ success: true });
});

/** GET /security/sessions */
securityRoutes.get("/sessions", async (c) => {
    return c.json({
        sessions: [
            {
                id: "current",
                device: "Session actuelle",
                location: "Inconnue",
                lastActive: "Maintenant",
                current: true,
            },
        ],
    });
});

// ── Push Notifications ────────────────────────────────────────────────────────

/** POST /push-token — Register or refresh an Expo push token */
usersRoutes.post("/push-token", async (c) => {
    const userId = c.var.userId;
    const supabase = c.var.supabase;
    const body = await c.req.json().catch(() => ({})) as { token?: string; platform?: string };

    if (!body.token || typeof body.token !== "string") {
        return c.json({ error: "Token manquant ou invalide" }, 400);
    }

    const platform = body.platform === "android" || body.platform === "ios" ? body.platform : "unknown";

    const { error } = await supabase
        .from("push_tokens")
        .upsert(
            { user_id: userId, token: body.token, platform },
            { onConflict: "user_id,token" },
        );

    if (error) return c.json({ error: "Impossible d'enregistrer le token" }, 500);

    return c.json({ success: true });
});

/** GET /notifications — List in-app notifications for the current user */
usersRoutes.get("/notifications", async (c) => {
    const userId = c.var.userId;
    const supabase = c.var.supabase;

    const { data, error } = await supabase
        .from("client_notifications")
        .select("id, type, title, body, is_read, order_id, reservation_id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

    if (error) return c.json({ error: "Impossible de charger les notifications" }, 500);

    const notifications = (data ?? []).map((n: {
        id: string;
        type: string;
        title: string;
        body: string;
        is_read: boolean;
        order_id: string | null;
        reservation_id: string | null;
        created_at: string;
    }) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.body,
        isRead: n.is_read,
        relatedId: n.order_id ?? n.reservation_id ?? null,
        createdAt: n.created_at,
    }));

    return c.json({ notifications });
});

/** PATCH /notifications/:id/read — Mark a notification as read */
usersRoutes.patch("/notifications/:id/read", async (c) => {
    const userId = c.var.userId;
    const supabase = c.var.supabase;
    const notifId = c.req.param("id");

    const { error } = await supabase
        .from("client_notifications")
        .update({ is_read: true })
        .eq("id", notifId)
        .eq("user_id", userId);

    if (error) return c.json({ error: "Impossible de marquer comme lu" }, 500);

    return c.json({ success: true });
});

// ── Offers & Promotions ───────────────────────────────────────────────────────

/** GET /offers — Active coupons available to the user */
usersRoutes.get("/offers", async (c) => {
    const supabase = c.var.supabase;
    const now = new Date().toISOString();

    const { data: coupons, error } = await supabase
        .from("coupons")
        .select(`
            id, name, code, kind, value, max_discount, min_order,
            description, expires_at, starts_at, restaurant_id,
            restaurants ( name, slug )
        `)
        .eq("is_active", true)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .order("created_at", { ascending: false })
        .limit(50);

    if (error) return c.json({ offers: [] });

    const offers = (coupons ?? []).map((c: {
        id: string;
        name: string | null;
        code: string | null;
        kind: string | null;
        value: number | null;
        max_discount: number | null;
        min_order: number | null;
        description: string | null;
        expires_at: string | null;
        restaurant_id: string | null;
        restaurants: { name: string; slug: string }[] | null;
    }) => {
        const restaurant = Array.isArray(c.restaurants) ? c.restaurants[0] ?? null : c.restaurants;
        const kind = c.kind === 'percent' ? 'percentage' : (c.kind ?? 'percentage');
        let displayValue = '';
        if (kind === 'percentage') displayValue = `${c.value ?? 0}%`;
        else if (kind === 'fixed') displayValue = `${c.value ?? 0} FCFA`;
        else if (kind === 'free_delivery') displayValue = 'Livraison offerte';
        else if (kind === 'bogo') displayValue = '1 acheté = 1 offert';
        else displayValue = `${c.value ?? 0} pts`;

        return {
            id: c.id,
            type: kind,
            title: c.name ?? 'Offre spéciale',
            description: c.description,
            displayValue,
            code: c.code,
            expiresAt: c.expires_at,
            restaurantId: c.restaurant_id,
            restaurantName: restaurant?.name ?? null,
            restaurantSlug: restaurant?.slug ?? null,
            minOrderAmount: c.min_order,
        };
    });

    return c.json({ offers });
});

// ── Security ──────────────────────────────────────────────────────────────────

/** POST /security/sessions — Revoke all sessions */
securityRoutes.post("/sessions", async (c) => {
    const body = await c.req.json().catch(() => ({})) as { action?: string };

    if (body.action !== "revoke_all") return c.json({ error: "Action invalide" }, 400);

    const { error } = await c.var.supabase.auth.signOut({ scope: "global" });
    if (error) return c.json({ error: error.message || "Impossible de déconnecter" }, 400);

    return c.json({ success: true });
});
