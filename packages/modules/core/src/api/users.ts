import { Hono } from "hono";
import type { CoreEnv, CoreVariables } from "./types";

export const usersRoutes = new Hono<{ Bindings: CoreEnv; Variables: CoreVariables }>();
export const securityRoutes = new Hono<{ Bindings: CoreEnv; Variables: CoreVariables }>();

// ── Users (Account) ──────────────────────────────────────────────────────────

/** DELETE /account — Delete user's account */
usersRoutes.delete("/", async (c) => {
    const userId = c.var.userId;
    const supabase = c.var.supabase;

    // Delete user from public.users (triggers/cascades should handle the rest if configured, 
    // or we do it manually. Based on our earlier work, we assume client data is in Supabase).
    const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", userId);

    if (error) return c.json({ error: error.message }, 500);
    
    // Note: Deleting from auth.users usually requires admin client, 
    // but here we are primarily concerned with the data migration.
    
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

/** POST /account/loyalty/movement — Add a wallet movement */
usersRoutes.post("/loyalty/movement", async (c) => {
    const userId = c.var.userId;
    const supabase = c.var.supabase;
    const body = await c.req.json<{
        type: 'credit' | 'debit';
        amount: number;
        reason: string;
        description: string;
        orderId?: string;
    }>();

    if (!body.amount || body.amount < 0) return c.json({ error: "Montant invalide" }, 400);

    // 1. Record movement
    const { data: movement, error: moveError } = await supabase
        .from("wallet_movements")
        .insert({
            user_id: userId,
            type: body.type,
            amount: body.amount,
            reason: body.reason,
            description: body.description,
            order_id: body.orderId || null
        })
        .select()
        .single();

    if (moveError) return c.json({ error: "Erreur lors de l'enregistrement du mouvement" }, 500);

    // 2. Update user balance via RPC
    const increment = body.type === 'credit' ? body.amount : -body.amount;
    await supabase.rpc('increment_wallet_balance', { 
        input_user_id: userId, 
        amount: increment 
    });

    return c.json({ success: true, movement });
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


/** POST /account/referral/reward — Register referral reward */
usersRoutes.post("/referral/reward", async (c) => {
    const { amount } = await c.req.json();
    const supabase = c.var.supabase;
    const userId = c.var.userId;

    // 1. Update referral stats
    const { error: userUpdateError } = await supabase.rpc("increment_referral_stats", {
        input_user_id: userId,
        reward_amount: amount
    });

    if (userUpdateError) return c.json({ error: "Erreur mise à jour stats parrainage" }, 500);

    // 2. Add wallet movement
    const { data: movement } = await supabase
        .from("wallet_movements")
        .insert({
            user_id: userId,
            type: "credit",
            reason: "referral_reward",
            amount,
            description: "Bonus parrainage"
        })
        .select()
        .single();

    // 3. Update balance
    await supabase.rpc("increment_wallet_balance", {
        input_user_id: userId,
        amount
    });

    return c.json({ success: true, movement });
});

/** PATCH /account/profile — Update user profile & metadata */
usersRoutes.patch("/profile", async (c) => {
    const body = await c.req.json();
    const supabase = c.var.supabase;
    const userId = c.var.userId;

    const updateData: any = {};
    if (body.fullName !== undefined) updateData.full_name = body.fullName;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.avatarUrl !== undefined) updateData.avatar_url = body.avatarUrl;
    if (body.preferredLang !== undefined) updateData.preferred_lang = body.preferredLang;
    if (body.notificationsEnabled !== undefined) updateData.notifications_enabled = body.notificationsEnabled;
    if (body.onboardingCompleted !== undefined) updateData.onboarding_completed = body.onboardingCompleted;
    if (body.themePreference !== undefined) updateData.theme_preference = body.themePreference;

    const { error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", userId);

    if (error) return c.json({ error: error.message }, 500);
    return c.json({ success: true });
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

/** POST /account/support/tickets — Create ticket */
usersRoutes.post("/support/tickets", async (c) => {
    const body = await c.req.json();
    const { data, error } = await c.var.supabase
        .from("support_tickets")
        .insert({
            reporter_id: c.var.userId,
            reporter_type: body.reporterType || "client",
            subject: body.subject,
            description: body.description,
            priority: body.priority || "medium",
            restaurant_id: body.restaurantId,
            order_id: body.orderId
        })
        .select()
        .single();

    if (error) return c.json({ error: error.message }, 500);
    return c.json({ success: true, ticket: data });
});

/** GET /account/orders — User order history */
usersRoutes.get("/orders", async (c) => {
    const { data, error } = await c.var.supabase
        .from("orders")
        .select("*, restaurant:restaurants(name)")
        .eq("customer_id", c.var.userId)
        .order("created_at", { ascending: false })
        .limit(100);

    if (error) return c.json({ error: error.message }, 500);
    return c.json({
        orders: (data || []).map((order: Record<string, unknown> & { restaurant?: { name?: string | null } | null }) => ({
            ...order,
            restaurant_name: order.restaurant?.name ?? null,
        })),
    });
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
    if (newPassword.length < 6) {
        return c.json({ error: "Le mot de passe doit contenir au moins 6 caractères" }, 400);
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

/** POST /security/sessions — Revoke all sessions */
securityRoutes.post("/sessions", async (c) => {
    const body = await c.req.json().catch(() => ({})) as { action?: string };

    if (body.action !== "revoke_all") return c.json({ error: "Action invalide" }, 400);

    const { error } = await c.var.supabase.auth.signOut({ scope: "global" });
    if (error) return c.json({ error: error.message || "Impossible de déconnecter" }, 400);

    return c.json({ success: true });
});
