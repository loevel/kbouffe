import { Hono } from "hono";
import type { Env, Variables } from "../../types";

export const restaurantSupportRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

restaurantSupportRoutes.get("/support/tickets", async (c) => {
    const restaurantId = c.var.restaurantId;
    const supabase = c.var.supabase;

    const { data, error } = await supabase
        .from("support_tickets")
        .select("id, subject, description, type, status, priority, created_at, updated_at")
        .eq("restaurant_id", restaurantId)
        .eq("reporter_type", "restaurant")
        .order("created_at", { ascending: false });

    if (error) return c.json({ error: "Erreur lors du chargement des tickets" }, 500);
    return c.json({ tickets: data || [] });
});

restaurantSupportRoutes.post("/support/tickets", async (c) => {
    const restaurantId = c.var.restaurantId;
    const userId = c.var.userId;
    const supabase = c.var.supabase;
    const body = await c.req.json();

    const { data, error } = await supabase
        .from("support_tickets")
        .insert({
            restaurant_id: restaurantId,
            reporter_id: userId,
            reporter_type: "restaurant",
            subject: body.subject,
            description: body.description,
            type: body.type || "general",
            status: "open",
            priority: body.priority || "normal",
        })
        .select()
        .single();

    if (error) return c.json({ error: "Erreur lors de la création du ticket" }, 500);
    return c.json(data, 201);
});

restaurantSupportRoutes.get("/export/:type", async (c) => {
    const restaurantId = c.var.restaurantId;
    const exportType = c.req.param("type");
    const supabase = c.var.supabase;
    let exportData: unknown = {};

    switch (exportType) {
        case "products": {
            const { data } = await supabase.from("products").select("*").eq("restaurant_id", restaurantId);
            exportData = data || [];
            break;
        }
        case "orders": {
            const { data } = await supabase.from("orders").select("*, order_items(*)").eq("restaurant_id", restaurantId);
            exportData = data || [];
            break;
        }
        case "reviews": {
            const { data } = await supabase.from("reviews").select("*").eq("restaurant_id", restaurantId);
            exportData = data || [];
            break;
        }
        case "team": {
            const { data } = await supabase.from("restaurant_members").select("*, users(id, email, full_name)").eq("restaurant_id", restaurantId);
            exportData = data || [];
            break;
        }
        case "all": {
            const [p, o, r, t] = await Promise.all([
                supabase.from("products").select("*").eq("restaurant_id", restaurantId),
                supabase.from("orders").select("*, order_items(*)").eq("restaurant_id", restaurantId),
                supabase.from("reviews").select("*").eq("restaurant_id", restaurantId),
                supabase.from("restaurant_members").select("*, users(id, email, full_name)").eq("restaurant_id", restaurantId),
            ]);
            exportData = { products: p.data || [], orders: o.data || [], reviews: r.data || [], team: t.data || [] };
            break;
        }
        default:
            return c.json({ error: "Type d'export invalide" }, 400);
    }

    const timestamp = new Date().toISOString().split("T")[0];
    return c.json({ data: exportData, filename: `kbouffe_${exportType}_${timestamp}.json`, exported_at: new Date().toISOString() });
});
