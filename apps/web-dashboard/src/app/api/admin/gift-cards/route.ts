import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { withAuth, apiError } from "@/lib/api/helpers";

/**
 * GET /api/admin/gift-cards — List all gift cards (admin created)
 * POST /api/admin/gift-cards — Create a new admin gift card
 */

function generateGiftCardCode(): string {
    const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const rand = (n: number) =>
        Array.from({ length: n }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("");
    return `KBGFT-${rand(4)}-${rand(4)}`;
}

export async function GET(request: NextRequest) {
    try {
        const auth = await withAuth();
        if (auth.error) return auth.error;

        const admin = await createAdminClient();
        const isActive = request.nextUrl.searchParams.get("is_active");

        let query = admin
            .from("gift_cards")
            .select("*")
            .eq("issued_by_type", "admin")
            .order("created_at", { ascending: false });

        if (isActive !== null) {
            query = query.eq("is_active", isActive === "true");
        }

        const { data, error } = await query;

        if (error) {
            console.error("GET /api/admin/gift-cards error:", error);
            return apiError("Erreur lors de la récupération des cartes cadeaux", 500);
        }

        return NextResponse.json({
            gift_cards: data ?? [],
            total: data?.length ?? 0,
        });
    } catch (error) {
        console.error("GET /api/admin/gift-cards error:", error);
        return apiError("Erreur serveur");
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await withAuth();
        if (auth.error) {
            console.error("Auth error:", auth.error);
            return auth.error;
        }
        const { userId } = auth.ctx;

        if (!userId) {
            return apiError("Authentification requise", 401);
        }

        const body = await request.json();
        const { initial_balance, issued_to, note, expires_at } = body;

        // Validation
        const balance = Number(initial_balance);
        if (!balance || balance <= 0 || !Number.isInteger(balance)) {
            return apiError("Le montant initial doit être un entier positif (FCFA)", 400);
        }

        const admin = await createAdminClient();

        // Generate unique code
        let code = "";
        let attempts = 0;
        while (attempts < 5) {
            code = generateGiftCardCode();
            const { data: existing } = await admin
                .from("gift_cards")
                .select("id")
                .eq("code", code)
                .maybeSingle();

            if (!existing) break;
            attempts++;
        }

        if (!code) {
            return apiError("Impossible de générer un code unique. Réessayez.", 500);
        }

        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        const { data, error } = await admin
            .from("gift_cards")
            .insert({
                id,
                restaurant_id: null, // Admin cards are not tied to a specific restaurant
                code,
                initial_balance: balance,
                current_balance: balance,
                issued_to: issued_to?.trim() ?? null,
                note: note?.trim() ?? null,
                expires_at: expires_at ?? null,
                is_active: true,
                created_by: userId,
                issued_by_type: "admin",
                issued_by_id: userId,
                usable_context: "all", // Admin cards can be used everywhere
                restricted_to_restaurant_id: null,
                created_at: now,
                updated_at: now,
            } as any)
            .select()
            .single();

        if (error) {
            console.error("POST /api/admin/gift-cards error:", error);
            return apiError("Erreur lors de la création de la carte cadeau", 500);
        }

        // Record initial movement (don't pass created_at, it has a default)
        const { error: movementError } = await admin.from("gift_card_movements").insert({
            gift_card_id: id,
            order_id: null,
            amount: balance,
            balance_after: balance,
            type: "issue",
            note: note?.trim() ?? "Émission initiale par admin",
        } as any);

        if (movementError) {
            console.error("Error recording gift card movement:", movementError);
            // Don't fail the whole request, the card was created successfully
            // Just log the error
        }

        return NextResponse.json({ gift_card: data }, 201);
    } catch (error) {
        console.error("POST /api/admin/gift-cards error:", error);
        return apiError("Erreur serveur");
    }
}
