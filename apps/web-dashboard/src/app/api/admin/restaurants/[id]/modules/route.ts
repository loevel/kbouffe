/**
 * GET  /api/admin/restaurants/[id]/modules — Liste les modules + leur statut pour un restaurant
 * PATCH /api/admin/restaurants/[id]/modules — Active ou désactive un module
 *
 * Réservé aux administrateurs plateforme.
 * Les opérations d'écriture utilisent un client service-role (bypass RLS complet).
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { withAdmin, apiError } from "@/lib/api/helpers";

/** Modules connus de la plateforme */
export const PLATFORM_MODULES = [
    {
        id: "reservations",
        name: "Réservations",
        description: "Gestion des réservations de tables, zones et disponibilités.",
        icon: "CalendarDays",
    },
    {
        id: "marketing",
        name: "Marketing",
        description: "Coupons de réduction, publicités sponsorisées et campagnes SMS.",
        icon: "Megaphone",
    },
    {
        id: "hr",
        name: "Équipe & RH",
        description: "Gestion de l'équipe, rôles, paies et livreurs.",
        icon: "Users",
    },
    {
        id: "delivery",
        name: "Livraison",
        description: "Zones de livraison, suivi des livreurs et dispatching.",
        icon: "Truck",
    },
    {
        id: "dine_in",
        name: "Sur place / Tables",
        description: "Gestion des tables, commandes sur place et droit de bouchon.",
        icon: "Utensils",
    },
] as const;

export type ModuleId = (typeof PLATFORM_MODULES)[number]["id"];

/**
 * Client service-role — bypass RLS total, uniquement côté serveur.
 * Différent de createServerClient/@supabase/ssr qui peut écraser le JWT
 * de la service role key avec le JWT de la session cookie.
 */
function adminDb() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
}

/**
 * GET — retourne la liste des modules avec leur statut pour ce restaurant
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error: authError } = await withAdmin();
    if (authError) return authError;

    const { id: restaurantId } = await params;

    const { data: activeModules, error } = await (adminDb() as any)
        .from("restaurant_modules")
        .select("module_id, is_active")
        .eq("restaurant_id", restaurantId);

    if (error) {
        console.error("[GET /api/admin/restaurants/[id]/modules]", error);
        return apiError("Erreur lors de la récupération des modules");
    }

    const activeMap = new Map<string, boolean>(
        (activeModules ?? []).map((m: { module_id: string; is_active: boolean }) => [m.module_id, m.is_active])
    );

    const modules = PLATFORM_MODULES.map((mod) => ({
        ...mod,
        isActive: activeMap.get(mod.id) ?? false,
    }));

    return NextResponse.json({ modules });
}

/**
 * PATCH — active ou désactive un module
 * Body: { moduleId: string, isActive: boolean }
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error: authError } = await withAdmin();
    if (authError) return authError;

    const { id: restaurantId } = await params;

    const body = await request.json().catch(() => ({})) as { moduleId?: string; isActive?: boolean };
    const { moduleId, isActive } = body;

    if (!moduleId || typeof isActive !== "boolean") {
        return apiError("moduleId et isActive requis", 400);
    }

    const knownIds = PLATFORM_MODULES.map((m) => m.id) as string[];
    if (!knownIds.includes(moduleId)) {
        return apiError("Module inconnu", 400);
    }

    const db = adminDb();

    // Vérifie si la ligne existe déjà
    const { data: existing } = await (db as any)
        .from("restaurant_modules")
        .select("id")
        .eq("restaurant_id", restaurantId)
        .eq("module_id", moduleId)
        .maybeSingle();

    let error;

    if (existing) {
        // Ligne existante → simple UPDATE
        ({ error } = await (db as any)
            .from("restaurant_modules")
            .update({ is_active: isActive })
            .eq("restaurant_id", restaurantId)
            .eq("module_id", moduleId));
    } else {
        // Nouvelle ligne → INSERT
        ({ error } = await (db as any)
            .from("restaurant_modules")
            .insert({
                restaurant_id: restaurantId,
                module_id: moduleId,
                is_active: isActive,
            }));
    }

    if (error) {
        console.error("[PATCH /api/admin/restaurants/[id]/modules]", error);
        return apiError(`Erreur DB: ${error.message}`, 500);
    }

    return NextResponse.json({ success: true, moduleId, isActive });
}
