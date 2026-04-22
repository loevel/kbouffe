/**
 * Loyalty routes
 *
 * GET   /loyalty         — Get program + rewards
 * POST  /loyalty         — Create or update loyalty program
 * GET   /loyalty/stats   — Loyalty statistics
 * GET   /loyalty/rewards — List active rewards
 * POST  /loyalty/rewards — Create a reward
 * DELETE /loyalty/rewards?id= — Deactivate a reward
 */
import { Hono } from "hono";
import type { Env, Variables } from "../../types";
import { parseBody } from "../../lib/body";

export const loyaltyRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

async function getProgramId(supabase: any, restaurantId: string): Promise<string | null> {
    const { data } = await supabase
        .from("loyalty_programs")
        .select("id")
        .eq("restaurant_id", restaurantId)
        .maybeSingle();
    return data?.id ?? null;
}

/** GET /loyalty — program + rewards */
loyaltyRoutes.get("/", async (c) => {
    const { restaurantId, supabase } = c.var;

    const { data: program, error: progErr } = await supabase
        .from("loyalty_programs" as any)
        .select("*")
        .eq("restaurant_id", restaurantId)
        .maybeSingle();

    if (progErr) return c.json({ error: progErr.message }, 500);

    let rewards: any[] = [];
    if (program) {
        const { data: rewardsData } = await supabase
            .from("loyalty_rewards" as any)
            .select("*")
            .eq("program_id", (program as any).id)
            .eq("is_active", true)
            .order("points_required", { ascending: true });
        rewards = rewardsData ?? [];
    }

    return c.json({ program, rewards });
});

/** POST /loyalty — create or update program */
loyaltyRoutes.post("/", async (c) => {
    const { restaurantId, supabase } = c.var;
    const body = await parseBody(c);
    if (!body) return c.json({ error: "Corps de la requête invalide" }, 400);
    const { name, points_per_fcfa, is_active } = body;

    if (points_per_fcfa !== undefined && (typeof points_per_fcfa !== "number" || points_per_fcfa < 1)) {
        return c.json({ error: "points_per_fcfa doit etre un entier >= 1" }, 400);
    }

    const { data: existing } = await supabase
        .from("loyalty_programs" as any)
        .select("id")
        .eq("restaurant_id", restaurantId)
        .maybeSingle();

    let program: any;
    if (existing) {
        const updates: Record<string, any> = {};
        if (name !== undefined) updates.name = name;
        if (points_per_fcfa !== undefined) updates.points_per_fcfa = points_per_fcfa;
        if (is_active !== undefined) updates.is_active = is_active;

        const { data, error } = await supabase
            .from("loyalty_programs" as any)
            .update(updates)
            .eq("id", (existing as any).id)
            .select()
            .single();
        if (error) return c.json({ error: error.message }, 500);
        program = data;
        return c.json({ program });
    } else {
        const { data, error } = await supabase
            .from("loyalty_programs" as any)
            .insert({
                restaurant_id: restaurantId,
                name: name || "Programme de fidelite",
                points_per_fcfa: points_per_fcfa ?? 1,
                is_active: is_active ?? true,
            })
            .select()
            .single();
        if (error) return c.json({ error: error.message }, 500);
        program = data;
        return c.json({ program }, 201);
    }
});

/** GET /loyalty/stats — statistics */
loyaltyRoutes.get("/stats", async (c) => {
    const { restaurantId, supabase } = c.var;

    const { count: totalMembers, data: memberRows } = await supabase
        .from("customer_loyalty" as any)
        .select("id", { count: "exact" })
        .eq("restaurant_id", restaurantId);

    const memberIds = (memberRows ?? []).map((m: any) => m.id) as string[];

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: activeData } = memberIds.length > 0
        ? await supabase
            .from("loyalty_transactions" as any)
            .select("customer_loyalty_id")
            .gte("created_at", startOfMonth.toISOString())
            .in("customer_loyalty_id", memberIds)
        : { data: [] };

    const activeMembers = new Set((activeData ?? []).map((t: any) => t.customer_loyalty_id)).size;

    const { data: pointsData } = await supabase
        .from("customer_loyalty" as any)
        .select("total_points_earned")
        .eq("restaurant_id", restaurantId);

    const totalPointsDistributed = (pointsData ?? []).reduce(
        (sum: number, row: any) => sum + (row.total_points_earned || 0), 0
    );

    const { data: redemptions } = memberIds.length > 0
        ? await supabase
            .from("loyalty_transactions" as any)
            .select("reward_id")
            .eq("type", "redeem")
            .not("reward_id", "is", null)
            .in("customer_loyalty_id", memberIds)
        : { data: [] };

    const rewardCounts: Record<string, number> = {};
    for (const r of redemptions ?? []) {
        if (r.reward_id) rewardCounts[r.reward_id] = (rewardCounts[r.reward_id] || 0) + 1;
    }

    const topRewardIds = Object.entries(rewardCounts)
        .sort(([, a], [, b]) => b - a).slice(0, 5).map(([id]) => id);

    let topRewards: any[] = [];
    if (topRewardIds.length > 0) {
        const { data: rewardNames } = await supabase
            .from("loyalty_rewards" as any)
            .select("id, name")
            .in("id", topRewardIds);
        topRewards = topRewardIds.map(id => ({
            id,
            name: ((rewardNames ?? []) as any[]).find((r: any) => r.id === id)?.name ?? "Recompense supprimee",
            redemptions: rewardCounts[id],
        }));
    }

    const { data: topMembers } = await supabase
        .from("customer_loyalty" as any)
        .select("id, customer_id, points_balance, total_points_earned, tier, created_at")
        .eq("restaurant_id", restaurantId)
        .order("total_points_earned", { ascending: false })
        .limit(10);

    const customerIds = (topMembers ?? []).map((m: any) => m.customer_id);
    let usersMap: Record<string, any> = {};
    if (customerIds.length > 0) {
        const { data: users } = await supabase
            .from("users")
            .select("id, full_name, email, phone")
            .in("id", customerIds);
        for (const u of users ?? []) usersMap[u.id] = u;
    }

    const membersWithNames = (topMembers ?? []).map((m: any) => ({
        ...m,
        customer: usersMap[m.customer_id] ?? null,
    }));

    return c.json({ totalMembers: totalMembers ?? 0, activeMembers, totalPointsDistributed, topRewards, topMembers: membersWithNames });
});

/** GET /loyalty/rewards */
loyaltyRoutes.get("/rewards", async (c) => {
    const { restaurantId, supabase } = c.var;
    const programId = await getProgramId(supabase, restaurantId);
    if (!programId) return c.json({ rewards: [] });

    const { data, error } = await supabase
        .from("loyalty_rewards" as any)
        .select("*")
        .eq("program_id", programId)
        .eq("is_active", true)
        .order("points_required", { ascending: true });

    if (error) return c.json({ error: error.message }, 500);
    return c.json({ rewards: data ?? [] });
});

const VALID_REWARD_TYPES = ["discount_percent", "discount_fixed", "free_item"];

/** POST /loyalty/rewards */
loyaltyRoutes.post("/rewards", async (c) => {
    const { restaurantId, supabase } = c.var;
    const programId = await getProgramId(supabase, restaurantId);
    if (!programId) return c.json({ error: "Aucun programme de fidelite. Creez-en un d'abord." }, 400);

    const body = await parseBody(c);
    if (!body) return c.json({ error: "Corps de la requête invalide" }, 400);
    const { name, description, points_required, reward_type, reward_value } = body;

    if (!name?.trim()) return c.json({ error: "Le nom est requis" }, 400);
    if (!points_required || points_required < 1) return c.json({ error: "Points requis invalides" }, 400);
    if (!VALID_REWARD_TYPES.includes(reward_type)) return c.json({ error: "Type de recompense invalide" }, 400);
    if (!reward_value || reward_value < 1) return c.json({ error: "Valeur de recompense invalide" }, 400);

    const { data, error } = await supabase
        .from("loyalty_rewards" as any)
        .insert({ program_id: programId, name: name.trim(), description: description?.trim() || null, points_required, reward_type, reward_value })
        .select()
        .single();

    if (error) return c.json({ error: error.message }, 500);
    return c.json({ reward: data }, 201);
});

/** DELETE /loyalty/rewards?id= — soft-delete */
loyaltyRoutes.delete("/rewards", async (c) => {
    const { restaurantId, supabase } = c.var;
    const rewardId = c.req.query("id");
    if (!rewardId) return c.json({ error: "id requis" }, 400);

    const programId = await getProgramId(supabase, restaurantId);
    if (!programId) return c.json({ error: "Programme non trouve" }, 404);

    const { error } = await supabase
        .from("loyalty_rewards" as any)
        .update({ is_active: false })
        .eq("id", rewardId)
        .eq("program_id", programId);

    if (error) return c.json({ error: error.message }, 500);
    return c.json({ success: true });
});
