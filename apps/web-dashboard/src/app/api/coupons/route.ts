/**
 * GET  /api/coupons — List all coupon codes for the restaurant
 * POST /api/coupons — Create a new coupon code
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

export async function GET(_request: NextRequest) {
    try {
        const auth = await withAuth();
        if (auth.error) return auth.error;
        const { ctx } = auth;

        const { data, error } = await ctx.supabase
            .from("coupons")
            .select("*")
            .eq("restaurant_id", ctx.restaurantId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Coupons query error:", error);
            return apiError("Erreur lors de la récupération des codes promo");
        }

        // Normalise kind→type et min_order_amount→min_order pour le front
        const coupons = (data ?? []).map((c: any) => ({
            ...c,
            type: c.type ?? c.kind,
            min_order: c.min_order ?? c.min_order_amount ?? 0,
        }));

        return NextResponse.json({ coupons, total: coupons.length });
    } catch (error) {
        console.error("GET /api/coupons error:", error);
        return apiError("Erreur serveur");
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await withAuth();
        if (auth.error) return auth.error;
        const { ctx } = auth;

        const body = await request.json();

        // Validation
        if (!body.code?.trim()) return apiError("Le code est requis", 400);
        if (!body.name?.trim()) return apiError("Le nom interne est requis", 400);
        if (!["percent", "fixed"].includes(body.type)) return apiError("Type invalide", 400);
        if (typeof body.value !== "number" || body.value <= 0) return apiError("La valeur doit être positive", 400);
        if (body.type === "percent" && body.value > 100) return apiError("Le pourcentage ne peut dépasser 100%", 400);

        const couponData = {
            restaurant_id: ctx.restaurantId,
            code: (body.code as string).toUpperCase().trim(),
            name: body.name.trim(),
            description: body.description ?? null,
            kind: body.type,           // colonne DB = kind
            value: body.value,
            min_order_amount: body.min_order ?? 0,   // colonne DB = min_order_amount
            min_order: body.min_order ?? 0,
            max_discount: body.max_discount ?? null,
            max_uses: body.max_uses ?? null,
            max_uses_per_customer: body.max_uses_per_customer ?? 1,
            current_uses: 0,
            is_active: body.is_active ?? true,
            starts_at: body.starts_at ?? null,
            expires_at: body.expires_at ?? null,
            applies_to: body.applies_to ?? "all",
            created_at: new Date().toISOString(),
        };

        const { data, error } = await ctx.supabase
            .from("coupons")
            .insert(couponData as any)
            .select()
            .single();

        if (error) {
            if (error.code === "23505") return apiError("Ce code promo existe déjà", 409);
            console.error("Coupon create error:", error);
            return apiError("Erreur lors de la création du code promo");
        }

        return NextResponse.json({ coupon: data }, { status: 201 });
    } catch (error) {
        console.error("POST /api/coupons error:", error);
        return apiError("Erreur serveur");
    }
}
