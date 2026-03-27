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

function getCameroonDateYMD() {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Africa/Douala",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(new Date());

    const year = parts.find((p) => p.type === "year")?.value;
    const month = parts.find((p) => p.type === "month")?.value;
    const day = parts.find((p) => p.type === "day")?.value;

    if (year && month && day) return `${year}-${month}-${day}`;
    return new Date().toISOString().split("T")[0];
}

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
        .select("id, is_published, has_reservations, reservation_slot_duration")
        .eq("slug", slug)
        .maybeSingle();

    if (restError || !restaurant) {
        return c.json({ error: "Restaurant introuvable" }, 404);
    }

    if (!restaurant.is_published || !restaurant.has_reservations) {
        return c.json({ error: "Ce restaurant ne prend pas de réservations en ligne" }, 400);
    }

    const duration = body.duration ?? restaurant.reservation_slot_duration ?? 90;

    const { data, error } = await supabase
        .from("reservations")
        .insert({
            restaurant_id: restaurant.id,
            customer_id: body.customerId ?? null,
            customer_name: body.customerName.trim(),
            customer_phone: body.customerPhone?.trim() || null,
            customer_email: body.customerEmail?.trim() || null,
            table_id: null,
            zone_id: body.zoneId ?? null,
            zone_preference: body.zonePreference ?? null,
            date: body.date,
            time: body.time,
            duration,
            party_size: partySize,
            status: "pending" as const,
            occasion: body.occasion ?? null,
            special_requests: body.specialRequests?.trim() || null,
        } as any)
        .select("id, status, date, time, party_size, occasion, zone_id")
        .single();

    if (error) {
        console.error("Public reservation error:", error);
        return c.json({ error: "Impossible de créer la réservation" }, 500);
    }

    return c.json({ success: true, reservation: data }, 201);
});

/** GET /store/:slug/availability — Public availability check */
publicReservationsRoutes.get("/:slug/availability", async (c) => {
    const slug = c.req.param("slug");
    const date = c.req.query("date");
    const partySizeParam = c.req.query("partySize");

    if (!date) {
        return c.json({ error: "Le paramètre 'date' est requis" }, 400);
    }

    const supabase = getAdminClient(c.env);

    // Resolve restaurant
    const { data: restaurant, error: restError } = await supabase
        .from("restaurants")
        .select("id, is_published, has_reservations, reservation_slot_duration, reservation_open_time, reservation_close_time, reservation_slot_interval")
        .eq("slug", slug)
        .maybeSingle();

    if (restError || !restaurant) {
        return c.json({ error: "Restaurant introuvable" }, 404);
    }

    if (!restaurant.is_published || !restaurant.has_reservations) {
        return c.json({ error: "Ce restaurant ne prend pas de réservations en ligne" }, 400);
    }

    const slotDuration = restaurant.reservation_slot_duration ?? 90;
    const openTime = restaurant.reservation_open_time ?? "10:00";
    const closeTime = restaurant.reservation_close_time ?? "22:00";
    const slotInterval = restaurant.reservation_slot_interval ?? 30;
    const partySize = partySizeParam ? Number(partySizeParam) : null;

    // Fetch zones with their tables
    const { data: zones } = await supabase
        .from("table_zones")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

    const { data: tables } = await supabase
        .from("restaurant_tables")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .eq("is_active", true);

    // Fetch active reservations for the requested date
    const { data: reservations } = await supabase
        .from("reservations")
        .select("id, time, duration, party_size, table_id, zone_id, status")
        .eq("restaurant_id", restaurant.id)
        .eq("date", date)
        .in("status", ["pending", "confirmed", "seated"]);

    const activeReservations = reservations ?? [];
    const allZones = zones ?? [];
    const allTables = tables ?? [];

    // Generate time slots
    const slots: string[] = [];
    const [openH, openM] = openTime.split(":").map(Number);
    const [closeH, closeM] = closeTime.split(":").map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    for (let m = openMinutes; m <= closeMinutes - slotDuration; m += slotInterval) {
        const h = Math.floor(m / 60);
        const min = m % 60;
        slots.push(`${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`);
    }

    // Helper: check if a reservation overlaps with a time slot
    function overlaps(resTime: string, resDuration: number, slotTime: string): boolean {
        const [rh, rm] = resTime.split(":").map(Number);
        const [sh, sm] = slotTime.split(":").map(Number);
        const resStart = rh * 60 + rm;
        const resEnd = resStart + (resDuration || slotDuration);
        const slotStart = sh * 60 + sm;
        const slotEnd = slotStart + slotDuration;
        return resStart < slotEnd && resEnd > slotStart;
    }

    // Helper: find when a table/zone becomes available after a given slot
    function findNextAvailable(blockingReservations: typeof activeReservations, slotTime: string): string | null {
        const [sh, sm] = slotTime.split(":").map(Number);
        const slotStart = sh * 60 + sm;

        // Find the latest end time among overlapping reservations
        let latestEnd = 0;
        for (const res of blockingReservations) {
            const [rh, rm] = res.time.split(":").map(Number);
            const resEnd = rh * 60 + rm + (res.duration || slotDuration);
            if (resEnd > latestEnd) latestEnd = resEnd;
        }

        if (latestEnd <= slotStart) return null;

        const h = Math.floor(latestEnd / 60);
        const m = latestEnd % 60;
        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    }

    // Build availability per zone
    const zoneAvailability = allZones.map((zone) => {
        const zoneTables = allTables.filter((t) => t.zone_id === zone.id);
        const zoneReservations = activeReservations.filter(
            (r) => r.zone_id === zone.id || zoneTables.some((t) => t.id === r.table_id)
        );

        const zoneSlots = slots.map((slotTime) => {
            // Count how many tables in this zone are booked at this time
            const overlapping = zoneReservations.filter((r) =>
                overlaps(r.time, r.duration ?? slotDuration, slotTime)
            );

            const bookedTableIds = new Set(overlapping.map((r) => r.table_id).filter(Boolean));
            const availCount = zoneTables.length > 0
                ? zoneTables.filter((t) => !bookedTableIds.has(t.id)).length
                : (zone.capacity > 0 ? Math.max(0, zone.capacity - overlapping.length) : (overlapping.length === 0 ? 1 : 0));

            // Check party size fit
            const sizeOk = !partySize || (partySize >= (zone.min_party_size ?? 1));
            const available = availCount > 0 && sizeOk;

            const reserved_until = !available ? findNextAvailable(overlapping, slotTime) : null;

            return {
                time: slotTime,
                available,
                available_count: availCount,
                reserved_until,
            };
        });

        return {
            zone: {
                id: zone.id,
                name: zone.name,
                type: zone.type,
                description: zone.description,
                image_url: zone.image_url,
                image_urls: (zone as any).image_urls ?? [],
                color: zone.color,
                capacity: zone.capacity,
                min_party_size: zone.min_party_size,
                amenities: zone.amenities,
                pricing_note: zone.pricing_note,
            },
            tables_count: zoneTables.length,
            total_capacity: zoneTables.reduce((sum, t) => sum + t.capacity, 0),
            slots: zoneSlots,
        };
    });

    // Also provide slots for "no zone" tables
    const unzonedTables = allTables.filter((t) => !t.zone_id);
    let unzonedSlots = null;
    if (unzonedTables.length > 0) {
        const unzonedReservations = activeReservations.filter(
            (r) => !r.zone_id && unzonedTables.some((t) => t.id === r.table_id)
        );
        unzonedSlots = slots.map((slotTime) => {
            const overlapping = unzonedReservations.filter((r) =>
                overlaps(r.time, r.duration ?? slotDuration, slotTime)
            );
            const bookedTableIds = new Set(overlapping.map((r) => r.table_id).filter(Boolean));
            const availCount = unzonedTables.filter((t) => !bookedTableIds.has(t.id)).length;
            const reserved_until = availCount === 0 ? findNextAvailable(overlapping, slotTime) : null;

            return { time: slotTime, available: availCount > 0, available_count: availCount, reserved_until };
        });
    }

    return c.json({
        date,
        slot_duration: slotDuration,
        open_time: openTime,
        close_time: closeTime,
        zones: zoneAvailability,
        unzoned_slots: unzonedSlots,
    });
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
        .select("*, restaurant_tables(number, capacity, table_zones(name)), table_zones!reservations_zone_id_fkey(id, name, type, color, image_url)", { count: "exact" })
        .eq("restaurant_id", c.var.restaurantId);

    if (status && status !== "all") query = query.eq("status", status);
    if (date) {
        query = query.eq("date", date);
    } else {
        // Default: show upcoming reservations (from today onwards)
        const today = getCameroonDateYMD();
        query = query.gte("date", today);
    }
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
            zone_id: body.zone_id ?? null,
            zone_preference: body.zone_preference ?? null,
            date: body.date,
            time: body.time,
            duration: body.duration ?? 90,
            party_size: body.party_size,
            status: "pending" as const,
            occasion: body.occasion ?? null,
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
    if (body.zone_id !== undefined) updateData.zone_id = body.zone_id;
    if (body.occasion !== undefined) updateData.occasion = body.occasion;
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
