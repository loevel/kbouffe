/**
 * PATCH  /api/coupons/[id] — Update a coupon (toggle active, edit fields)
 * DELETE /api/coupons/[id] — Delete a coupon
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
    try {
        const auth = await withAuth();
        if (auth.error) return auth.error;
        const { ctx } = auth;
        const { id } = await params;

        const body = await request.json();

        // Ensure the coupon belongs to this restaurant
        const { data: existingRaw } = await ctx.supabase
            .from("coupons")
            .select("id")
            .eq("id", id)
            .eq("restaurant_id", ctx.restaurantId)
            .single();

        const existing = existingRaw as { id: string } | null;

        if (!existing) return apiError("Code promo introuvable", 404);

        const allowed = [
            "name", "description", "value", "max_discount",
            "max_uses", "max_uses_per_customer", "is_active", "starts_at", "expires_at",
            "applies_to",
        ];
        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        for (const key of allowed) {
            if (key in body) updates[key] = body[key];
        }
        // Mapper type→kind et min_order→min_order_amount
        if ("type" in body) updates["kind"] = body["type"];
        if ("min_order" in body) { updates["min_order"] = body["min_order"]; updates["min_order_amount"] = body["min_order"]; }

        const { data, error } = await (ctx.supabase.from("coupons") as any)
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Coupon update error:", error);
            return apiError("Erreur lors de la mise à jour du code promo");
        }

        return NextResponse.json({ coupon: data });
    } catch (error) {
        console.error("PATCH /api/coupons/[id] error:", error);
        return apiError("Erreur serveur");
    }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
    try {
        const auth = await withAuth();
        if (auth.error) return auth.error;
        const { ctx } = auth;
        const { id } = await params;

        const { error } = await ctx.supabase
            .from("coupons")
            .delete()
            .eq("id", id)
            .eq("restaurant_id", ctx.restaurantId);

        if (error) {
            console.error("Coupon delete error:", error);
            return apiError("Erreur lors de la suppression du code promo");
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/coupons/[id] error:", error);
        return apiError("Erreur serveur");
    }
}
