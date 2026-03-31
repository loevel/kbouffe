/**
 * HR — Rapports de primes & pourboires (reporting consultatif)
 *
 * Légal: KBouffe NE VERSE PAS directement les salaires/primes au personnel.
 * KBouffe génère un rapport INDICATIF avec les calculs CNPS/IRPP.
 * C'est le PATRON (employeur légal) qui effectue le paiement et confirme.
 *
 * CGU: "Les calculs fournis par KBouffe sont à titre indicatif.
 *       Le restaurateur est seul responsable du paiement effectif de
 *       son personnel et de ses obligations CNPS/DGI."
 *
 * Ref: Code du Travail camerounais Loi n°92/007,
 *      CNPS Décret n°78/484, CGI Art.68 (IRPP)
 *
 * Taux CNPS 2024:
 *   Employeur = 11.2% | Salarié = 5.25% (déduit du net)
 * Taux IRPP (simplifié, indicatif):
 *   ≤ 62 000 FCFA/mois → 10%
 *   ≤ 310 000 → 15% | ≤ 620 000 → 25% | > 620 000 → 35%
 */
import { Hono } from "hono";
import { CoreEnv as Env, CoreVariables as Variables } from "@kbouffe/module-core";

export const payoutsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/** Calcul CNPS + IRPP indicatif (entiers FCFA) */
function computeDeductions(gross: number) {
    const cnps_employer = Math.floor(gross * 0.112);
    const cnps_employee = Math.floor(gross * 0.0525);

    let irpp_rate = 0.10;
    if (gross > 620_000) irpp_rate = 0.35;
    else if (gross > 310_000) irpp_rate = 0.25;
    else if (gross > 62_000) irpp_rate = 0.15;

    const irpp_estimate = Math.floor(gross * irpp_rate);
    const net_amount = Math.max(0, gross - cnps_employee - irpp_estimate);

    return { cnps_employer, cnps_employee, irpp_estimate, net_amount };
}

/** GET /payouts — Versements KBouffe (abonnements, commissions) */
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
        },
    });
});

/** GET /payouts/staff — Rapports de primes/pourboires du personnel */
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

/**
 * POST /payouts/staff — Créer un rapport de prime/pourboire (indicatif)
 *
 * Crée une entrée avec status "pending".
 * Le restaurateur doit ensuite confirmer le paiement via PATCH /:id/confirm.
 * KBouffe NE déclenche aucun virement automatique.
 */
payoutsRoutes.post("/staff", async (c) => {
    const body = await c.req.json();
    const { memberId, amount, notes, paymentMethod, payoutType, periodStart, periodEnd } = body;

    if (!memberId) return c.json({ error: "L'identifiant du membre est requis" }, 400);
    if (!amount || amount <= 0) return c.json({ error: "Le montant doit être supérieur à 0" }, 400);

    const deductions = computeDeductions(amount);

    const { data, error } = await c.var.supabase
        .from("staff_payouts")
        .insert({
            restaurant_id: c.var.restaurantId,
            member_id: memberId,
            amount,
            payout_type: payoutType ?? "tip",
            payment_method: paymentMethod ?? "manual",
            // status "pending" = calculé par KBouffe, en attente confirmation employeur
            status: "pending",
            ...deductions,
            notes: notes ?? null,
            period_start: periodStart ?? null,
            period_end: periodEnd ?? null,
        })
        .select()
        .single();

    if (error) return c.json({ error: error.message }, 500);

    return c.json({
        success: true,
        payout: data,
        disclaimer: "Ce rapport est à titre indicatif. Le restaurateur est seul responsable du paiement effectif et de ses obligations CNPS/DGI.",
    }, 201);
});

/**
 * PATCH /payouts/staff/:id/confirm — Le PATRON confirme avoir effectué le paiement
 *
 * KBouffe enregistre uniquement la confirmation. Il ne transfère pas de fonds.
 */
payoutsRoutes.patch("/staff/:id/confirm", async (c) => {
    const { data: existing, error: fetchError } = await c.var.supabase
        .from("staff_payouts")
        .select("id, status")
        .eq("id", c.req.param("id"))
        .eq("restaurant_id", c.var.restaurantId)
        .single();

    if (fetchError || !existing) return c.json({ error: "Rapport introuvable" }, 404);
    if (existing.status === "confirmed") return c.json({ error: "Ce versement est déjà confirmé" }, 409);

    const { data, error } = await c.var.supabase
        .from("staff_payouts")
        .update({
            status: "confirmed",
            confirmed_by: c.var.userId,
            confirmed_at: new Date().toISOString(),
        })
        .eq("id", c.req.param("id"))
        .select()
        .single();

    if (error) return c.json({ error: error.message }, 500);
    return c.json({ success: true, payout: data });
});

/**
 * GET /payouts/payroll-report — Rapport de paie consultatif avec synthèse CNPS/IRPP
 *
 * Agrège les primes/pourboires par membre sur une période donnée.
 * Résultat INDICATIF — responsabilité du restaurateur.
 */
payoutsRoutes.get("/payroll-report", async (c) => {
    const periodStart = c.req.query("period_start");
    const periodEnd = c.req.query("period_end");

    let query = c.var.supabase
        .from("staff_payouts")
        .select(`
            member_id, amount, payout_type, status,
            cnps_employer, cnps_employee, irpp_estimate, net_amount,
            member:restaurant_members(
                id, role,
                user:users(full_name, phone, avatar_url)
            )
        `)
        .eq("restaurant_id", c.var.restaurantId)
        .eq("status", "pending");

    if (periodStart) query = query.gte("created_at", periodStart);
    if (periodEnd) query = query.lte("created_at", periodEnd);

    const { data, error } = await query;
    if (error) return c.json({ error: error.message }, 500);

    const rows = data ?? [];

    // Agréger par membre
    const byMember: Record<string, {
        member_id: string;
        full_name: string;
        phone: string | null;
        avatar_url: string | null;
        role: string;
        gross_total: number;
        cnps_employer_total: number;
        cnps_employee_total: number;
        irpp_total: number;
        net_total: number;
        entries: number;
    }> = {};

    for (const row of rows) {
        const memberId = row.member_id;
        if (!byMember[memberId]) {
            const user = (row.member as any)?.user ?? {};
            byMember[memberId] = {
                member_id: memberId,
                full_name: user.full_name ?? "Inconnu",
                phone: user.phone ?? null,
                avatar_url: user.avatar_url ?? null,
                role: (row.member as any)?.role ?? "—",
                gross_total: 0,
                cnps_employer_total: 0,
                cnps_employee_total: 0,
                irpp_total: 0,
                net_total: 0,
                entries: 0,
            };
        }
        byMember[memberId].gross_total += row.amount ?? 0;
        byMember[memberId].cnps_employer_total += row.cnps_employer ?? 0;
        byMember[memberId].cnps_employee_total += row.cnps_employee ?? 0;
        byMember[memberId].irpp_total += row.irpp_estimate ?? 0;
        byMember[memberId].net_total += row.net_amount ?? 0;
        byMember[memberId].entries += 1;
    }

    const totals = Object.values(byMember);
    const grandTotal = totals.reduce((acc, m) => ({
        gross: acc.gross + m.gross_total,
        cnps_employer: acc.cnps_employer + m.cnps_employer_total,
        cnps_employee: acc.cnps_employee + m.cnps_employee_total,
        irpp: acc.irpp + m.irpp_total,
        net: acc.net + m.net_total,
    }), { gross: 0, cnps_employer: 0, cnps_employee: 0, irpp: 0, net: 0 });

    return c.json({
        report: totals,
        grand_total: grandTotal,
        period: { start: periodStart ?? null, end: periodEnd ?? null },
        disclaimer: "Ce rapport est à titre indicatif. Le restaurateur est seul responsable du paiement effectif de son personnel et de ses obligations envers la CNPS et la DGI.",
        cnps_rates: { employer: "11.2%", employee: "5.25%" },
    });
});
