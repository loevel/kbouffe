/**
 * Caisse routes — Suivi de caisse (cash drawer tracking)
 * SYSCOHADA-compliant end-of-day cash reconciliation for Cameroon restaurants.
 *
 * POST /caisse/open         — Open a new cash session (fond de caisse)
 * GET  /caisse/current      — Current open session + today's movements summary
 * POST /caisse/close        — Close session (enter closing amount → compute discrepancy)
 * POST /caisse/movement     — Add manual movement (cash_in / cash_out)
 * GET  /caisse/history      — Last 30 closed sessions with summary
 * GET  /caisse/:sessionId/report — Full session report with all movements
 */
import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { CoreEnv as Env, CoreVariables as Variables } from "@kbouffe/module-core";

function getAdminClient(c: any) {
    return createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

export const caisseRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ── Helper: compute expected amount from movements ───────────────────
function computeExpected(
    openingAmount: number,
    movements: Array<{ type: string; amount: number }>,
): {
    totalSales: number;
    totalCashIn: number;
    totalCashOut: number;
    totalRefunds: number;
    expectedAmount: number;
} {
    const totalSales = movements
        .filter((m) => m.type === "sale")
        .reduce((s, m) => s + m.amount, 0);
    const totalCashIn = movements
        .filter((m) => m.type === "cash_in")
        .reduce((s, m) => s + m.amount, 0);
    const totalCashOut = movements
        .filter((m) => m.type === "cash_out")
        .reduce((s, m) => s + m.amount, 0);
    const totalRefunds = movements
        .filter((m) => m.type === "refund")
        .reduce((s, m) => s + m.amount, 0);
    const expectedAmount =
        openingAmount + totalSales + totalCashIn - totalCashOut - totalRefunds;
    return { totalSales, totalCashIn, totalCashOut, totalRefunds, expectedAmount };
}

// ── POST /caisse/open — Open a new cash session ──────────────────────
caisseRoutes.post("/open", async (c) => {
    const restaurantId = c.var.restaurantId;
    if (!restaurantId) return c.json({ error: "Non authentifié" }, 401);

    const admin = getAdminClient(c);
    let body: any;
    try {
        body = await c.req.json();
    } catch {
        return c.json({ error: "Corps de requête invalide" }, 400);
    }

    const { openingAmount, operatorMemberId, notes } = body;

    if (typeof openingAmount !== "number" || !Number.isFinite(openingAmount) || openingAmount < 0) {
        return c.json({ error: "Montant d'ouverture invalide (nombre positif requis)" }, 400);
    }

    // Ensure no session is currently open
    const { data: existing, error: checkError } = await admin
        .from("cash_sessions")
        .select("id")
        .eq("restaurant_id", restaurantId)
        .is("closed_at", null)
        .maybeSingle();

    if (checkError) {
        console.error("Check open session error:", checkError);
        return c.json({ error: "Erreur lors de la vérification de la session" }, 500);
    }
    if (existing) {
        return c.json({ error: "Une session de caisse est déjà ouverte" }, 409);
    }

    const { data, error } = await admin
        .from("cash_sessions")
        .insert({
            restaurant_id: restaurantId,
            opening_amount: Math.round(openingAmount),
            operator_member_id: operatorMemberId ?? null,
            notes: notes ?? null,
        })
        .select()
        .single();

    if (error) {
        console.error("Open cash session error:", error);
        return c.json({ error: "Erreur lors de l'ouverture de la caisse" }, 500);
    }

    return c.json(
        {
            success: true,
            session: {
                id: data.id,
                openingAmount: data.opening_amount,
                openedAt: data.opened_at,
            },
        },
        201,
    );
});

// ── GET /caisse/current — Current open session with summary ──────────
caisseRoutes.get("/current", async (c) => {
    const restaurantId = c.var.restaurantId;
    if (!restaurantId) return c.json({ error: "Non authentifié" }, 401);

    const admin = getAdminClient(c);

    const { data: session, error: sessionError } = await admin
        .from("cash_sessions")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .is("closed_at", null)
        .maybeSingle();

    if (sessionError) {
        console.error("Get current session error:", sessionError);
        return c.json({ error: "Erreur lors de la récupération de la session" }, 500);
    }

    if (!session) {
        return c.json({ session: null });
    }

    const { data: movements, error: movError } = await admin
        .from("cash_movements")
        .select("*")
        .eq("session_id", session.id)
        .order("created_at", { ascending: false });

    if (movError) {
        console.error("Get movements error:", movError);
        return c.json({ error: "Erreur lors de la récupération des mouvements" }, 500);
    }

    const allMovements = movements ?? [];
    const { totalSales, totalCashIn, totalCashOut, totalRefunds, expectedAmount } =
        computeExpected(session.opening_amount, allMovements);

    return c.json({
        session: {
            id: session.id,
            openingAmount: session.opening_amount,
            openedAt: session.opened_at,
            operatorMemberId: session.operator_member_id,
        },
        summary: {
            totalSales,
            totalCashIn,
            totalCashOut,
            totalRefunds,
            expectedAmount,
            movementCount: allMovements.length,
        },
        recentMovements: allMovements.slice(0, 20),
    });
});

// ── POST /caisse/close — Close the current session ───────────────────
caisseRoutes.post("/close", async (c) => {
    const restaurantId = c.var.restaurantId;
    if (!restaurantId) return c.json({ error: "Non authentifié" }, 401);

    const admin = getAdminClient(c);
    let body: any;
    try {
        body = await c.req.json();
    } catch {
        return c.json({ error: "Corps de requête invalide" }, 400);
    }

    const { closingAmount, notes } = body;

    if (typeof closingAmount !== "number" || !Number.isFinite(closingAmount) || closingAmount < 0) {
        return c.json({ error: "Montant de clôture invalide (nombre positif requis)" }, 400);
    }

    // Find open session
    const { data: session, error: sessionError } = await admin
        .from("cash_sessions")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .is("closed_at", null)
        .maybeSingle();

    if (sessionError) {
        console.error("Get open session error:", sessionError);
        return c.json({ error: "Erreur lors de la récupération de la session" }, 500);
    }
    if (!session) {
        return c.json({ error: "Aucune session de caisse ouverte" }, 404);
    }

    // Load all movements
    const { data: movements } = await admin
        .from("cash_movements")
        .select("type, amount")
        .eq("session_id", session.id);

    const { totalSales, totalCashIn, totalCashOut, totalRefunds, expectedAmount } =
        computeExpected(session.opening_amount, movements ?? []);

    const discrepancy = Math.round(closingAmount) - expectedAmount;

    const closedAt = new Date();
    const openedAt = new Date(session.opened_at);
    const sessionDurationMinutes = Math.round(
        (closedAt.getTime() - openedAt.getTime()) / 60000,
    );

    const { error: updateError } = await admin
        .from("cash_sessions")
        .update({
            closing_amount: Math.round(closingAmount),
            expected_amount: expectedAmount,
            discrepancy,
            notes: notes ?? null,
            closed_at: closedAt.toISOString(),
        })
        .eq("id", session.id);

    if (updateError) {
        console.error("Close cash session error:", updateError);
        return c.json({ error: "Erreur lors de la clôture de la caisse" }, 500);
    }

    return c.json({
        success: true,
        report: {
            openingAmount: session.opening_amount,
            closingAmount: Math.round(closingAmount),
            expectedAmount,
            discrepancy,
            totalSales,
            totalCashIn,
            totalCashOut,
            totalRefunds,
            sessionDurationMinutes,
        },
    });
});

// ── POST /caisse/movement — Add a manual cash movement ───────────────
caisseRoutes.post("/movement", async (c) => {
    const restaurantId = c.var.restaurantId;
    if (!restaurantId) return c.json({ error: "Non authentifié" }, 401);

    const admin = getAdminClient(c);
    let body: any;
    try {
        body = await c.req.json();
    } catch {
        return c.json({ error: "Corps de requête invalide" }, 400);
    }

    const { type, amount, note, operatorMemberId } = body;

    if (!["cash_in", "cash_out"].includes(type)) {
        return c.json({ error: "Type de mouvement invalide (cash_in ou cash_out)" }, 400);
    }
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
        return c.json({ error: "Montant invalide (doit être un nombre positif)" }, 400);
    }
    if (!note || typeof note !== "string" || note.trim().length === 0) {
        return c.json({ error: "Note requise pour les mouvements manuels" }, 400);
    }

    // Find open session
    const { data: session, error: sessionError } = await admin
        .from("cash_sessions")
        .select("id")
        .eq("restaurant_id", restaurantId)
        .is("closed_at", null)
        .maybeSingle();

    if (sessionError) {
        console.error("Get open session error:", sessionError);
        return c.json({ error: "Erreur lors de la récupération de la session" }, 500);
    }
    if (!session) {
        return c.json({ error: "Aucune session de caisse ouverte" }, 404);
    }

    const { data, error } = await admin
        .from("cash_movements")
        .insert({
            session_id: session.id,
            restaurant_id: restaurantId,
            type,
            amount: Math.round(amount),
            note: note.trim().slice(0, 500),
            operator_member_id: operatorMemberId ?? null,
        })
        .select()
        .single();

    if (error) {
        console.error("Add movement error:", error);
        return c.json({ error: "Erreur lors de l'ajout du mouvement" }, 500);
    }

    return c.json(
        {
            success: true,
            movement: {
                id: data.id,
                type: data.type,
                amount: data.amount,
                note: data.note,
                createdAt: data.created_at,
            },
        },
        201,
    );
});

// ── GET /caisse/history — Last 30 closed sessions ────────────────────
caisseRoutes.get("/history", async (c) => {
    const restaurantId = c.var.restaurantId;
    if (!restaurantId) return c.json({ error: "Non authentifié" }, 401);

    const admin = getAdminClient(c);

    const { data, error } = await admin
        .from("cash_sessions")
        .select(
            "id, opening_amount, closing_amount, expected_amount, discrepancy, notes, opened_at, closed_at, operator_member_id",
        )
        .eq("restaurant_id", restaurantId)
        .not("closed_at", "is", null)
        .order("closed_at", { ascending: false })
        .limit(30);

    if (error) {
        console.error("Cash history error:", error);
        return c.json({ error: "Erreur lors de la récupération de l'historique" }, 500);
    }

    return c.json({ sessions: data ?? [] });
});

// ── GET /caisse/:sessionId/report — Full session report ──────────────
caisseRoutes.get("/:sessionId/report", async (c) => {
    const restaurantId = c.var.restaurantId;
    if (!restaurantId) return c.json({ error: "Non authentifié" }, 401);

    const admin = getAdminClient(c);
    const sessionId = c.req.param("sessionId");

    const { data: session, error: sessionError } = await admin
        .from("cash_sessions")
        .select("*")
        .eq("id", sessionId)
        .eq("restaurant_id", restaurantId)
        .single();

    if (sessionError || !session) {
        return c.json({ error: "Session introuvable" }, 404);
    }

    const { data: movements, error: movError } = await admin
        .from("cash_movements")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

    if (movError) {
        console.error("Get session movements error:", movError);
        return c.json({ error: "Erreur lors de la récupération des mouvements" }, 500);
    }

    const allMovements = movements ?? [];
    const byType = {
        sales: allMovements.filter((m) => m.type === "sale"),
        cashIns: allMovements.filter((m) => m.type === "cash_in"),
        cashOuts: allMovements.filter((m) => m.type === "cash_out"),
        refunds: allMovements.filter((m) => m.type === "refund"),
    };

    return c.json({ session, movements: allMovements, byType });
});
