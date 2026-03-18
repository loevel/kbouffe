/**
 * Tables routes — migrated from web-dashboard/src/app/api/tables/
 *
 * GET  /tables    — List tables & zones
 * POST /tables    — Create a table
 */
import { Hono } from "hono";
import { CoreEnv as Env, CoreVariables as Variables } from "@kbouffe/module-core";

export const tablesRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/** GET /tables */
tablesRoutes.get("/", async (c) => {
    const zoneFilter = c.req.query("zone");
    const search = c.req.query("q")?.trim().toLowerCase();
    const sort = c.req.query("sort") ?? "sort_order"; // sort_order | capacity | status | number

    const { data: zones, error: zonesError } = await c.var.supabase
        .from("table_zones")
        .select("*")
        .eq("restaurant_id", c.var.restaurantId)
        .order("sort_order", { ascending: true });

    if (zonesError) {
        console.error("Zones query error:", zonesError);
        return c.json({ error: "Erreur lors de la récupération des zones" }, 500);
    }

    let query = c.var.supabase
        .from("restaurant_tables")
        .select("*, table_zones(name, type)")
        .eq("restaurant_id", c.var.restaurantId);

    if (zoneFilter && zoneFilter !== "all") {
        query = query.eq("zone_id", zoneFilter);
    }

    if (search) {
        query = query.or(`number.ilike.%${search}%,table_zones.name.ilike.%${search}%`);
    }

    const sortColumn = ["capacity", "status", "number"].includes(sort) ? sort : "sort_order";

    const { data: tables, error: tablesError } = await query.order(sortColumn as any, { ascending: true });

    if (tablesError) {
        console.error("Tables query error:", tablesError);
        return c.json({ error: "Erreur lors de la récupération des tables" }, 500);
    }

    return c.json({ tables: tables ?? [], zones: zones ?? [] });
});

/** POST /tables */
tablesRoutes.post("/", async (c) => {
    const body = await c.req.json();

    if (!body.number) return c.json({ error: "Le numéro de table est requis" }, 400);
    if (body.capacity !== undefined && Number(body.capacity) < 1) {
        return c.json({ error: "La capacité doit être positive" }, 400);
    }

    // Check duplicates within the restaurant
    const { data: existing } = await c.var.supabase
        .from("restaurant_tables")
        .select("id")
        .eq("restaurant_id", c.var.restaurantId)
        .eq("number", body.number)
        .maybeSingle();

    if (existing) return c.json({ error: "Ce numéro de table existe déjà" }, 409);

    const { data, error } = await c.var.supabase
        .from("restaurant_tables")
        .insert({
            restaurant_id: c.var.restaurantId,
            number: body.number,
            zone_id: body.zone_id ?? null,
            capacity: body.capacity ?? 4,
            status: "available" as const,
            qr_code: body.qr_code ?? null,
            is_active: true,
            sort_order: body.sort_order ?? 0,
        } as any)
        .select()
        .single();

    if (error) {
        if (error.code === "23505") return c.json({ error: "Ce numéro de table existe déjà" }, 409);
        console.error("Create table error:", error);
        return c.json({ error: "Erreur lors de la création de la table" }, 500);
    }

    return c.json({ success: true, table: data }, 201);
});

/** PATCH /tables/:id */
tablesRoutes.patch("/:id", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.number !== undefined) updateData.number = body.number;
    if (body.capacity !== undefined) updateData.capacity = body.capacity;
    if (body.zone_id !== undefined) updateData.zone_id = body.zone_id;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.sort_order !== undefined) updateData.sort_order = body.sort_order;
    if (body.qr_code !== undefined) updateData.qr_code = body.qr_code;

    // Prevent duplicate table numbers inside the same restaurant
    if (body.number) {
        const { data: duplicate } = await c.var.supabase
            .from("restaurant_tables")
            .select("id")
            .eq("restaurant_id", c.var.restaurantId)
            .eq("number", body.number)
            .neq("id", id)
            .maybeSingle();
        if (duplicate) return c.json({ error: "Ce numéro de table existe déjà" }, 409);
    }

    const { data, error } = await c.var.supabase
        .from("restaurant_tables")
        .update(updateData as any)
        .eq("id", id)
        .eq("restaurant_id", c.var.restaurantId)
        .select()
        .single();

    if (error) {
        console.error("Update table error:", error);
        return c.json({ error: "Erreur lors de la mise à jour de la table" }, 500);
    }

    return c.json({ success: true, table: data });
});

/** DELETE /tables/:id */
tablesRoutes.delete("/:id", async (c) => {
    const id = c.req.param("id");

    // Free pending/confirmed reservations linked to this table
    await c.var.supabase
        .from("reservations")
        .update({ table_id: null } as any)
        .eq("table_id", id)
        .eq("restaurant_id", c.var.restaurantId)
        .in("status", ["pending", "confirmed"]);

    const { error } = await c.var.supabase
        .from("restaurant_tables")
        .delete()
        .eq("id", id)
        .eq("restaurant_id", c.var.restaurantId);

    if (error) {
        console.error("Delete table error:", error);
        return c.json({ error: "Erreur lors de la suppression de la table" }, 500);
    }

    return c.json({ success: true });
});
