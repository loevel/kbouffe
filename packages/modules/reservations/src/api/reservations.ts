/**
 * Reservations routes — migrated from web-dashboard/src/app/api/reservations/
 *
 * GET  /reservations          — List reservations
 * POST /reservations          — Create a reservation
 */
import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { CoreEnv as Env, CoreVariables as Variables } from "@kbouffe/module-core";

export const reservationsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();
export const publicReservationsRoutes = new Hono<{ Bindings: Env }>();

/** Helper to get admin supabase client */
function getAdminClient(env: Env) {
    if (!env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
    return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

/** POST /store/:slug/reservations — Public reservation creation */
publicReservationsRoutes.post("/:slug/reservations", async (c) => {
    const slug = c.req.param("slug");
    const body = await c.req.json();

    if (!body.customerName || !body.date || !body.time || !body.partySize) {
        return c.json({ error: "Nom, date, heure et nombre de personnes requis" }, 400);
    }

    const partySize = Number(body.partySize);
    if (isNaN(partySize) || partySize < 1 || partySize > 20) {
        return c.json({ error: "Nombre de personnes invalide (1-20)" }, 400);
    }

    const supabase = getAdminClient(c.env);

    // Resolve restaurant by slug
    const { data: restaurant, error: restError } = await supabase
        .from("restaurants")
        .select("id, is_published, has_reservations")
        .eq("slug", slug)
        .maybeSingle();

    if (restError || !restaurant) {
        return c.json({ error: "Restaurant introuvable" }, 404);
    }

    if (!restaurant.is_published || !restaurant.has_reservations) {
        return c.json({ error: "Ce restaurant ne prend pas de réservations en ligne" }, 400);
    }

    const { data, error } = await supabase
        .from("reservations")
        .insert({
            restaurant_id: restaurant.id,
            customer_id: body.customerId ?? null,
            customer_name: body.customerName.trim(),
            customer_phone: body.customerPhone?.trim() || null,
            customer_email: body.customerEmail?.trim() || null,
            table_id: null,
            zone_preference: null,
            date: body.date,
            time: body.time,
            duration: 90,
            party_size: partySize,
            status: "pending" as const,
            special_requests: body.specialRequests?.trim() || null,
        } as any)
        .select("id, status, date, time, party_size")
        .single();

    if (error) {
        console.error("Public reservation error:", error);
        return c.json({ error: "Impossible de créer la réservation" }, 500);
    }

    return c.json({ success: true, reservation: data }, 201);
});

/** GET /reservations */
reservationsRoutes.get("/", async (c) => {
    const status = c.req.query("status");
    const date = c.req.query("date");
    const search = c.req.query("search");
    const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "50", 10)));

    let query = c.var.supabase
        .from("reservations")
        .select("*, restaurant_tables(number, capacity, table_zones(name))", { count: "exact" })
        .eq("restaurant_id", c.var.restaurantId);

    if (status && status !== "all") query = query.eq("status", status);
    if (date) query = query.eq("date", date);
    if (search) {
        query = query.or(
            `customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%,customer_email.ilike.%${search}%`,
        );
    }

    query = query
        .order("date", { ascending: true })
        .order("time", { ascending: true })
        .range((page - 1) * limit, page * limit - 1);

    const { data, count, error } = await query;

    if (error) {
        console.error("Reservations query error:", error);
        return c.json({ error: "Erreur lors de la récupération des réservations" }, 500);
    }

    return c.json({ reservations: data ?? [], total: count ?? 0, page, limit });
});

/** POST /reservations */
reservationsRoutes.post("/", async (c) => {
    const body = await c.req.json();

    if (!body.customer_name || !body.date || !body.time || !body.party_size) {
        return c.json({ error: "Nom du client, date, heure et nombre de personnes requis" }, 400);
    }

    // Verify restaurant allows reservations (private route check)
    const { data: restaurant } = await c.var.supabase
        .from("restaurants")
        .select("has_reservations")
        .eq("id", c.var.restaurantId)
        .single();

    if (restaurant && !restaurant.has_reservations) {
        return c.json({ error: "Les réservations sont désactivées pour ce restaurant" }, 403);
    }

    // If table_id is provided, verify capacity
    if (body.table_id) {
        const { data: table } = await c.var.supabase
            .from("restaurant_tables")
            .select("capacity")
            .eq("id", body.table_id)
            .single();
        
        if (table && table.capacity < body.party_size) {
            return c.json({ error: `La table n'a pas assez de places (${table.capacity})` }, 400);
        }
    }

    const { data, error } = await c.var.supabase
        .from("reservations")
        .insert({
            restaurant_id: c.var.restaurantId,
            customer_id: body.customer_id ?? null,
            customer_name: body.customer_name,
            customer_phone: body.customer_phone ?? null,
            customer_email: body.customer_email ?? null,
            table_id: body.table_id ?? null,
            zone_preference: body.zone_preference ?? null,
            date: body.date,
            time: body.time,
            duration: body.duration ?? 90,
            party_size: body.party_size,
            status: "pending" as const,
            special_requests: body.special_requests ?? null,
            deposit_amount: body.deposit_amount ?? null,
        } as any)
        .select()
        .single();

    if (error) {
        console.error("Create reservation error:", error);
        return c.json({ error: "Erreur lors de la création de la réservation" }, 500);
    }

    return c.json({ success: true, reservation: data }, 201);
});

/** GET /reservations/:id */
reservationsRoutes.get("/:id", async (c) => {
    const id = c.req.param("id");

    const { data, error } = await c.var.supabase
        .from("reservations")
        .select("*, restaurant_tables(number, capacity, table_zones(name, type))")
        .eq("id", id)
        .eq("restaurant_id", c.var.restaurantId)
        .single();

    if (error || !data) return c.json({ error: "Réservation introuvable" }, 404);
    return c.json({ reservation: data });
});

/** PATCH /reservations/:id */
reservationsRoutes.patch("/:id", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    // 1. Metadata updates
    if (body.date !== undefined) updateData.date = body.date;
    if (body.time !== undefined) updateData.time = body.time;
    if (body.duration !== undefined) updateData.duration = body.duration;
    if (body.party_size !== undefined) updateData.party_size = body.party_size;
    if (body.special_requests !== undefined) updateData.special_requests = body.special_requests;
    if (body.zone_preference !== undefined) updateData.zone_preference = body.zone_preference;
    if (body.deposit_paid !== undefined) updateData.deposit_paid = body.deposit_paid;
    if (body.cancellation_reason !== undefined) updateData.cancellation_reason = body.cancellation_reason;

    if (body.status === "confirmed") updateData.confirmed_at = new Date().toISOString();
    if (body.status === "seated") updateData.seated_at = new Date().toISOString();

    // 2. Capacity check if table or party_size changes
    if (body.table_id || body.party_size) {
        const { data: current } = await c.var.supabase
            .from("reservations")
            .select("table_id, party_size")
            .eq("id", id)
            .single();

        const tid = body.table_id || current?.table_id;
        const size = body.party_size || current?.party_size;

        if (tid && size) {
            const { data: table } = await c.var.supabase
                .from("restaurant_tables")
                .select("capacity")
                .eq("id", tid)
                .single();
            if (table && table.capacity < size) {
                return c.json({ error: `La table n'a pas assez de places (${table.capacity})` }, 400);
            }
        }
    }

    // 3. Atomic status / table update via RPC
    const statusChanged = body.status !== undefined;
    const tableChanged = body.table_id !== undefined;

    if (statusChanged || tableChanged) {
        // We get the target status (either new or current)
        let targetStatus = body.status;
        if (!targetStatus) {
            const { data: res } = await c.var.supabase.from("reservations").select("status").eq("id", id).single();
            targetStatus = res?.status;
        }

        const { error: rpcError } = await c.var.supabase.rpc("update_reservation_atomic", {
            p_res_id: id,
            p_status: targetStatus,
            p_table_id: body.table_id ?? null,
            p_update_table_id: tableChanged,
        });

        if (rpcError) {
            console.error("Atomic update RPC error:", rpcError);
            return c.json({ error: "Erreur lors de la mise à jour atomique" }, 500);
        }
    }

    // 4. Update other metadata
    if (Object.keys(updateData).length > 1) { // updated_at is always there
        const { data, error } = await c.var.supabase
            .from("reservations")
            .update(updateData as any)
            .eq("id", id)
            .eq("restaurant_id", c.var.restaurantId)
            .select()
            .single();

        if (error) {
            console.error("Update reservation error:", error);
            return c.json({ error: "Erreur lors de la mise à jour" }, 500);
        }
        return c.json({ success: true, reservation: data });
    }

    return c.json({ success: true });
});

/** DELETE /reservations/:id */
reservationsRoutes.delete("/:id", async (c) => {
    const id = c.req.param("id");

    // Free the table if reservation was active
    const { data: res } = await c.var.supabase
        .from("reservations")
        .select("table_id, status")
        .eq("id", id)
        .eq("restaurant_id", c.var.restaurantId)
        .single();

    const resData = res as { table_id?: string | null; status?: string } | null;
    if (resData?.table_id && (resData.status === "confirmed" || resData.status === "seated")) {
        await c.var.supabase
            .from("restaurant_tables")
            .update({ status: "available", updated_at: new Date().toISOString() } as any)
            .eq("id", resData.table_id)
            .eq("restaurant_id", c.var.restaurantId);
    }

    const { error } = await c.var.supabase
        .from("reservations")
        .delete()
        .eq("id", id)
        .eq("restaurant_id", c.var.restaurantId);

    if (error) {
        console.error("Delete reservation error:", error);
        return c.json({ error: "Erreur lors de la suppression" }, 500);
    }

    return c.json({ success: true });
});
