/**
 * POST /api/store/[slug]/reservations
 * Route publique — crée une réservation pour un client.
 *
 * Body:
 *   customerName       string  (requis)
 *   customerPhone?     string
 *   customerEmail?     string
 *   customerId?        string  (UUID si connecté)
 *   partySize          number  (requis)
 *   date               string  YYYY-MM-DD  (requis)
 *   time               string  HH:MM       (requis)
 *   zoneId?            string
 *   occasion?          string
 *   specialRequests?   string
 *   byobRequested?     boolean  — client apporte ses boissons
 *   corkageFeeAcknowledged? boolean — client confirme payer le droit de bouchon sur place
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ slug: string }> };

export async function POST(request: NextRequest, { params }: Params) {
    try {
        const { slug } = await params;
        if (!slug) {
            return NextResponse.json({ error: "Slug manquant" }, { status: 400 });
        }

        const body = await request.json();
        const {
            customerName,
            customerPhone,
            customerEmail,
            customerId,
            partySize,
            date,
            time,
            zoneId,
            occasion,
            specialRequests,
            byobRequested = false,
            corkageFeeAcknowledged = false,
        } = body;

        // ── Validation ─────────────────────────────────────────────────
        if (!customerName?.trim()) {
            return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
        }
        if (!partySize || partySize < 1) {
            return NextResponse.json({ error: "Nombre de personnes invalide" }, { status: 400 });
        }
        if (!date || !time) {
            return NextResponse.json({ error: "Date et heure sont requis" }, { status: 400 });
        }

        const supabase = await createAdminClient();
        const db = supabase as any;

        // ── Résoudre le restaurant ──────────────────────────────────────
        const { data: restaurant, error: restError } = await db
            .from("restaurants")
            .select("id, name, has_reservations, corkage_fee_amount")
            .eq("slug", slug)
            .eq("is_published", true)
            .single();

        if (restError || !restaurant) {
            return NextResponse.json({ error: "Restaurant introuvable" }, { status: 404 });
        }

        if (!restaurant.has_reservations) {
            return NextResponse.json(
                { error: "Ce restaurant n'accepte pas les réservations en ligne" },
                { status: 400 }
            );
        }

        // ── Droit de bouchon : snapshot du montant actuel ──────────────
        // Si le client a demandé BYOB, on snapshote le montant à cet instant
        // (le prix peut changer plus tard, on préserve ce que le client a vu)
        const corkageFeeSnapshot = byobRequested
            ? (restaurant.corkage_fee_amount ?? 0)
            : 0;

        // ── Créer la réservation ────────────────────────────────────────
        const { data: reservation, error: insertError } = await db
            .from("reservations")
            .insert({
                restaurant_id: restaurant.id,
                customer_id: customerId ?? null,
                customer_name: customerName.trim(),
                customer_phone: customerPhone?.trim() ?? null,
                customer_email: customerEmail?.trim() ?? null,
                party_size: partySize,
                date,
                time,
                zone_preference: zoneId ?? null,
                occasion: occasion ?? null,
                special_requests: specialRequests?.trim() ?? null,
                status: "pending",
                // BYOB / droit de bouchon
                byob_requested: byobRequested,
                corkage_fee_amount: corkageFeeSnapshot,
                corkage_fee_acknowledged: byobRequested ? corkageFeeAcknowledged : false,
            })
            .select("id, date, time, party_size, status, byob_requested, corkage_fee_amount, corkage_fee_acknowledged")
            .single();

        if (insertError || !reservation) {
            console.error("[POST /api/store/[slug]/reservations]", insertError);
            return NextResponse.json(
                { error: "Impossible de créer la réservation. Réessayez." },
                { status: 500 }
            );
        }

        // ── Notification in-app pour l'admin du restaurant ─────────────
        await db.from("restaurant_notifications").insert({
            restaurant_id: restaurant.id,
            type: "new_reservation",
            title: `📅 Nouvelle réservation — ${customerName.trim()}`,
            body: `${partySize} pers. · ${date} à ${time}${byobRequested ? " · 🍷 BYOB" : ""}`,
            payload: { reservation_id: reservation.id },
            is_read: false,
        }).then(() => {}).catch(() => {});

        return NextResponse.json({ reservation }, { status: 201 });
    } catch (err) {
        console.error("[POST reservations] unexpected:", err);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
