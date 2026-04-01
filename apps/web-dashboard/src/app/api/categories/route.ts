/**
 * GET  /api/categories  — list categories for the authenticated merchant's restaurant
 * POST /api/categories  — create a new category
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api/helpers";

export async function GET() {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { supabase, restaurantId } = auth.ctx;

    const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .eq("restaurant_id", restaurantId)
        .order("name", { ascending: true });

    if (error) {
        console.error("[GET /api/categories]", error);
        return apiError("Erreur lors du chargement des catégories");
    }

    return NextResponse.json({ categories: data ?? [] });
}

export async function POST(request: NextRequest) {
    const auth = await withAuth();
    if (auth.error) return auth.error;
    const { supabase, restaurantId } = auth.ctx;

    try {
        const body = await request.json();
        const { name } = body;

        if (!name?.trim()) {
            return apiError("Le nom de la catégorie est requis", 400);
        }

        const { data, error } = await supabase
            .from("categories")
            .insert({ restaurant_id: restaurantId, name: name.trim() } as any)
            .select("id, name")
            .single();

        if (error) {
            console.error("[POST /api/categories]", error);
            return apiError("Erreur lors de la création de la catégorie");
        }

        return NextResponse.json({ category: data }, { status: 201 });
    } catch (err: any) {
        console.error("[POST /api/categories] Unexpected:", err);
        return apiError("Erreur serveur");
    }
}
