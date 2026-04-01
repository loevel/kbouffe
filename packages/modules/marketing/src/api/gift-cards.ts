/**
 * Gift Cards routes — module marketing
 *
 * PRIVATE (auth merchant) :
 *   GET    /gift-cards          — Lister les cartes du restaurant
 *   POST   /gift-cards          — Créer une carte (code généré automatiquement)
 *   GET    /gift-cards/:id      — Détail + mouvements
 *   DELETE /gift-cards/:id      — Désactiver (soft delete)
 *
 * PUBLIC (checkout, no auth) :
 *   POST   /gift-cards/validate — Vérifier code + solde avant commande
 */
import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { CoreEnv as Env, CoreVariables as Variables } from "@kbouffe/module-core";

// ── Types ────────────────────────────────────────────────────────────────────

interface GiftCard {
    id: string;
    restaurant_id: string;
    code: string;
    initial_balance: number;
    current_balance: number;
    issued_to: string | null;
    note: string | null;
    expires_at: string | null;
    is_active: boolean;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Génère un code de type `KBGFT-XXXX-XXXX`
 * 8 caractères alphanumériques majuscules en deux groupes de 4.
 */
function generateGiftCardCode(): string {
    const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // exclut O, I, 0, 1 pour lisibilité
    const rand = (n: number) =>
        Array.from({ length: n }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("");
    return `KBGFT-${rand(4)}-${rand(4)}`;
}

// ── Routes privées (merchant authentifié) ───────────────────────────────────

export const giftCardRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/** GET /gift-cards — Lister les cartes du restaurant */
giftCardRoutes.get("/", async (c) => {
    const isActive = c.req.query("is_active");

    let query = c.var.supabase
        .from("gift_cards")
        .select("*")
        .eq("restaurant_id", c.var.restaurantId)
        .order("created_at", { ascending: false });

    if (isActive !== undefined) {
        query = query.eq("is_active", isActive === "true");
    }

    const { data, error } = await query;

    if (error) {
        console.error("[GET /gift-cards] Supabase error:", error);
        return c.json({ error: "Erreur lors de la récupération des cartes cadeaux" }, 500);
    }

    return c.json({ gift_cards: data ?? [], total: data?.length ?? 0 });
});

/** POST /gift-cards — Créer une carte cadeau */
giftCardRoutes.post("/", async (c) => {
    const body = await c.req.json<{
        initial_balance?: number;
        issued_to?: string;
        note?: string;
        expires_at?: string;
    }>();

    // Validation
    const balance = Number(body.initial_balance);
    if (!balance || balance <= 0 || !Number.isInteger(balance)) {
        return c.json({ error: "Le montant initial doit être un entier positif (FCFA)" }, 400);
    }

    // Générer un code unique (tentatives en cas de collision)
    let code = "";
    let attempts = 0;
    while (attempts < 5) {
        code = generateGiftCardCode();
        const { data: existing } = await c.var.supabase
            .from("gift_cards")
            .select("id")
            .eq("restaurant_id", c.var.restaurantId)
            .eq("code", code)
            .maybeSingle();

        if (!existing) break; // code unique trouvé
        attempts++;
    }

    if (!code) {
        return c.json({ error: "Impossible de générer un code unique. Réessayez." }, 500);
    }

    const { data, error } = await c.var.supabase
        .from("gift_cards")
        .insert({
            id: crypto.randomUUID(),
            restaurant_id: c.var.restaurantId,
            code,
            initial_balance: balance,
            current_balance: balance,
            issued_to: body.issued_to?.trim() ?? null,
            note: body.note?.trim() ?? null,
            expires_at: body.expires_at ?? null,
            is_active: true,
            created_by: c.var.userId ?? null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        } as any)
        .select()
        .single();

    if (error) {
        console.error("[POST /gift-cards] Supabase error:", error);
        return c.json({ error: "Erreur lors de la création de la carte cadeau" }, 500);
    }

    // Enregistrer le mouvement initial (issue)
    await c.var.supabase
        .from("gift_card_movements")
        .insert({
            id: crypto.randomUUID(),
            gift_card_id: (data as GiftCard).id,
            order_id: null,
            amount: balance,
            balance_after: balance,
            type: "issue",
            note: body.note?.trim() ?? "Émission initiale",
            created_at: new Date().toISOString(),
        } as any);

    return c.json({ gift_card: data }, 201);
});

/** GET /gift-cards/:id — Détail + historique des mouvements */
giftCardRoutes.get("/:id", async (c) => {
    const id = c.req.param("id");

    // Vérifier l'appartenance au restaurant
    const { data: card, error: cardError } = await c.var.supabase
        .from("gift_cards")
        .select("*")
        .eq("id", id)
        .eq("restaurant_id", c.var.restaurantId)
        .single();

    if (cardError || !card) {
        return c.json({ error: "Carte cadeau introuvable" }, 404);
    }

    // Récupérer les mouvements
    const { data: movements } = await c.var.supabase
        .from("gift_card_movements")
        .select("*")
        .eq("gift_card_id", id)
        .order("created_at", { ascending: false });

    return c.json({ gift_card: card, movements: movements ?? [] });
});

/** DELETE /gift-cards/:id — Désactiver la carte (soft delete) */
giftCardRoutes.delete("/:id", async (c) => {
    const id = c.req.param("id");

    // Vérifier l'appartenance
    const { data: existing } = await c.var.supabase
        .from("gift_cards")
        .select("id")
        .eq("id", id)
        .eq("restaurant_id", c.var.restaurantId)
        .maybeSingle();

    if (!existing) {
        return c.json({ error: "Carte cadeau introuvable" }, 404);
    }

    const { error } = await c.var.supabase
        .from("gift_cards")
        .update({ is_active: false, updated_at: new Date().toISOString() } as any)
        .eq("id", id);

    if (error) {
        console.error("[DELETE /gift-cards/:id] Supabase error:", error);
        return c.json({ error: "Erreur lors de la désactivation de la carte cadeau" }, 500);
    }

    return c.json({ success: true });
});

// ── Routes publiques (checkout, no auth) ─────────────────────────────────────

export const giftCardPublicRoutes = new Hono<{ Bindings: Env }>();

/**
 * POST /validate
 * Vérifie le code d'une carte cadeau et retourne le solde applicable.
 * Lecture seule — la déduction réelle est faite lors de la création de commande.
 *
 * Body: { code: string; restaurant_id: string; order_total?: number }
 * Response: { valid: true; current_balance: number; amount_applicable: number; gift_card_id: string }
 *           | { valid: false; error: string }
 */
giftCardPublicRoutes.post("/validate", async (c) => {
    const body = await c.req.json<{
        code?: string;
        restaurant_id?: string;
        order_total?: number;
    }>();

    if (!body.code?.trim() || !body.restaurant_id) {
        return c.json({ valid: false, error: "Code et restaurant requis" }, 400);
    }

    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);

    const { data: card, error } = await supabase
        .from("gift_cards")
        .select("id, current_balance, expires_at, is_active")
        .eq("restaurant_id", body.restaurant_id)
        .eq("code", body.code.trim().toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

    if (error) {
        console.error("[POST /gift-cards/validate] Supabase error:", error);
        return c.json({ valid: false, error: "Erreur lors de la validation" }, 500);
    }

    if (!card) {
        return c.json({ valid: false, error: "Code carte cadeau invalide ou inactif" });
    }

    // Vérifier la date d'expiration
    if (card.expires_at && new Date(card.expires_at) < new Date()) {
        return c.json({ valid: false, error: "Cette carte cadeau a expiré" });
    }

    if (card.current_balance <= 0) {
        return c.json({ valid: false, error: "Le solde de cette carte cadeau est épuisé" });
    }

    const orderTotal = Number(body.order_total ?? 0);
    const amountApplicable = orderTotal > 0
        ? Math.min(card.current_balance, orderTotal)
        : card.current_balance;

    return c.json({
        valid: true,
        gift_card_id: card.id,
        current_balance: card.current_balance,
        amount_applicable: amountApplicable,
    });
});
