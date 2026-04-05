import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

/** Generate a unique gift card code — format: GC-XXXX-XXXX */
function generateCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 to avoid confusion
    const seg = (len: number) =>
        Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    return `GC-${seg(4)}-${seg(4)}`;
}

/**
 * GET /api/gift-cards
 * List all gift cards for the authenticated restaurant.
 * Query params: ?is_active=true|false
 */
export async function GET(request: NextRequest) {
    const { ctx, error } = await withAuth();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const isActiveParam = searchParams.get("is_active");

    try {
        let query = ctx.supabase
            .from("gift_cards")
            .select("*")
            .eq("restaurant_id", ctx.restaurantId)
            .order("created_at", { ascending: false });

        if (isActiveParam === "true")  query = query.eq("is_active", true);
        if (isActiveParam === "false") query = query.eq("is_active", false);

        const { data, error: dbErr } = await query;
        if (dbErr) {
            console.error("GET /api/gift-cards error:", dbErr);
            return apiError("Erreur lors de la récupération des cartes cadeaux");
        }

        return NextResponse.json({ gift_cards: data ?? [] });
    } catch (err) {
        console.error("GET /api/gift-cards exception:", err);
        return apiError("Erreur interne");
    }
}

/**
 * POST /api/gift-cards
 * Create a new gift card.
 * Body: { initial_balance, issued_to?, note?, expires_at? }
 */
export async function POST(request: NextRequest) {
    const { ctx, error } = await withAuth();
    if (error) return error;

    try {
        const body = await request.json();
        const { initial_balance, issued_to, note, expires_at } = body;

        // Validate
        if (!initial_balance || typeof initial_balance !== "number" || initial_balance <= 0 || !Number.isInteger(initial_balance)) {
            return apiError("Montant invalide — entrez un entier positif en FCFA.", 400);
        }

        // Generate a unique code (retry up to 5 times on collision)
        let code = "";
        for (let attempt = 0; attempt < 5; attempt++) {
            const candidate = generateCode();
            const { data: existing } = await ctx.supabase
                .from("gift_cards")
                .select("id")
                .eq("code", candidate)
                .maybeSingle();
            if (!existing) { code = candidate; break; }
        }
        if (!code) return apiError("Impossible de générer un code unique. Réessayez.", 500);

        const { data: giftCard, error: insertErr } = await ctx.supabase
            .from("gift_cards")
            .insert({
                restaurant_id: ctx.restaurantId,
                created_by: ctx.userId,
                code,
                initial_balance,
                current_balance: initial_balance,
                issued_to: issued_to?.trim() || null,
                note: note?.trim() || null,
                expires_at: expires_at || null,
                is_active: true,
            })
            .select()
            .single();

        if (insertErr) {
            console.error("POST /api/gift-cards insert error:", insertErr);
            return apiError("Erreur lors de la création de la carte cadeau");
        }

        // Record the initial issuance movement
        await ctx.supabase.from("gift_card_movements").insert({
            gift_card_id: giftCard.id,
            amount: initial_balance,
            balance_after: initial_balance,
            type: "issue",
            note: note?.trim() || "Émission initiale",
        });

        return NextResponse.json({ gift_card: giftCard }, { status: 201 });
    } catch (err) {
        console.error("POST /api/gift-cards exception:", err);
        return apiError("Erreur interne");
    }
}
