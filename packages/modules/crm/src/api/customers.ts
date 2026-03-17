/**
 * Customers route
 */
import { Hono } from "hono";
import { CoreEnv as Env, CoreVariables as Variables } from "@kbouffe/module-core";

interface CustomerAggregate {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    totalOrders: number;
    totalSpent: number;
    lastOrderAt: string;
    createdAt: string;
}

interface OrderRow {
    customer_id: string | null;
    customer_name: string;
    customer_phone: string;
    total: number;
    created_at: string;
}

export const customersRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/** GET /customers */
customersRoutes.get("/", async (c) => {
    const search = c.req.query("search")?.trim() ?? "";
    const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "50", 10)));
    const offset = (page - 1) * limit;

    // 1) Fetch orders for this restaurant
    const { data: ordersRaw, error: ordersError } = await c.var.supabase
        .from("orders")
        .select("customer_id, customer_name, customer_phone, total, created_at")
        .eq("restaurant_id", c.var.restaurantId)
        .order("created_at", { ascending: false })
        .limit(5000);

    if (ordersError) throw new Error(ordersError.message);

    const orders = (ordersRaw ?? []) as unknown as OrderRow[];

    // 2) Aggregate by customer_id (or fallback phone)
    const customerMap = new Map<string, CustomerAggregate>();

    for (const order of orders) {
        const customerId = order.customer_id ?? null;
        const fallbackKey = order.customer_phone || order.customer_name || "anonymous";
        const key = customerId || `anon:${fallbackKey}`;
        const createdAt = order.created_at || new Date().toISOString();

        const existing = customerMap.get(key);
        if (!existing) {
            customerMap.set(key, {
                id: customerId || key,
                name: order.customer_name || "Client",
                phone: order.customer_phone || "",
                email: null,
                totalOrders: 1,
                totalSpent: order.total || 0,
                lastOrderAt: createdAt,
                createdAt,
            });
        } else {
            existing.totalOrders += 1;
            existing.totalSpent += order.total || 0;
            if (new Date(createdAt) > new Date(existing.lastOrderAt)) {
                existing.lastOrderAt = createdAt;
            }
        }
    }

    // 3) Enrich with global profiles from Supabase
    const globalIds = Array.from(customerMap.values())
        .map((c) => c.id)
        .filter((id) => !id.startsWith("anon:"));

    if (globalIds.length > 0) {
        const { data: globalProfiles, error: profilesError } = await c.var.supabase
            .from("users")
            .select("id, full_name, email, phone, created_at")
            .in("id", globalIds);

        if (profilesError) {
            console.error("Error fetching global profiles:", profilesError);
        } else {
            const profileById = new Map(globalProfiles.map((p) => [p.id, p]));

            for (const customer of customerMap.values()) {
                const profile = profileById.get(customer.id);
                if (!profile) continue;
                customer.name = profile.full_name || profile.email || customer.name;
                customer.phone = profile.phone || customer.phone;
                customer.email = profile.email || null;
                customer.createdAt = profile.created_at
                    ? new Date(profile.created_at).toISOString()
                    : customer.createdAt;
            }
        }
    }

    // 4) Search, sort, paginate
    const filtered = Array.from(customerMap.values()).filter((customer) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            customer.name.toLowerCase().includes(q) ||
            customer.phone.toLowerCase().includes(q) ||
            (customer.email ?? "").toLowerCase().includes(q)
        );
    });

    filtered.sort((a, b) => new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime());

    const total = filtered.length;
    const customers = filtered.slice(offset, offset + limit);

    return c.json({
        customers,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        },
    });
});
