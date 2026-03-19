/**
 * Payouts route
 */
import { Hono } from "hono";
import { CoreEnv as Env, CoreVariables as Variables } from "@kbouffe/module-core";

export const payoutsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/** GET /payouts */
payoutsRoutes.get("/", async (c) => {
    const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "50", 10)));
    const offset = (page - 1) * limit;

    const { data, count, error } = await c.var.supabase
        .from("payouts")
        .select("*", { count: "exact" })
        .eq("restaurant_id", c.var.restaurantId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error("Payouts query error:", error);
        return c.json({ error: "Erreur lors de la récupération des versements" }, 500);
    }

    return c.json({ 
        payouts: data ?? [],
        pagination: {
            page,
            limit,
            total: count ?? 0,
            totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
        }
    });
});

/** GET /payouts/staff — Historique des versements au personnel */
payoutsRoutes.get("/staff", async (c) => {
    const { data, error } = await c.var.supabase
        .from("staff_payouts")
        .select(`
            *,
            member:restaurant_members(
                user:users(full_name, avatar_url)
            )
        `)
        .eq("restaurant_id", c.var.restaurantId)
        .order("created_at", { ascending: false });

    if (error) return c.json({ error: error.message }, 500);
    return c.json({ payouts: data });
});

/** POST /payouts/staff — Enregistrer un nouveau versement personnel */
payoutsRoutes.post("/staff", async (c) => {
    const body = await c.req.json();
    const { memberId, amount, notes, paymentMethod } = body;

    const { data, error } = await c.var.supabase
        .from("staff_payouts")
        .insert({
            restaurant_id: c.var.restaurantId,
            member_id: memberId,
            amount,
            notes,
            payment_method: paymentMethod || "momo",
            status: "paid", // Par défaut considéré comme payé si enregistré manuellement
            paid_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) return c.json({ error: error.message }, 500);
    return c.json({ success: true, payout: data });
});
