import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        const search = request.nextUrl.searchParams.get("search")?.trim() ?? "";
        const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") ?? "1"));
        const limit = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get("limit") ?? "50")));
        const offset = (page - 1) * limit;

        // 1) Récupérer le restaurant du marchand authentifié (Supabase)
        const { data: merchantProfile, error: profileError } = await supabase
            .from("users")
            .select("restaurant_id")
            .eq("id", user.id)
            .maybeSingle();

        if (profileError || !merchantProfile?.restaurant_id) {
            return NextResponse.json({
                customers: [],
                pagination: { page, limit, total: 0, totalPages: 1 },
            });
        }

        const restaurantId = merchantProfile.restaurant_id;

        // 2) Source métier: commandes de CE restaurant (Supabase)
        const { data: ordersRaw, error: ordersError } = await supabase
            .from("orders")
            .select("customer_id, customer_name, customer_phone, total, created_at")
            .eq("restaurant_id", restaurantId)
            .order("created_at", { ascending: false })
            .limit(5000);

        if (ordersError) {
            throw new Error(ordersError.message);
        }

        const orders = (ordersRaw ?? []) as unknown as OrderRow[];

        // 3) Agréger les clients par customer_id (ou fallback téléphone)
        const customerMap = new Map<string, CustomerAggregate>();

        for (const order of orders) {
            const customerId = order.customer_id ?? null;
            const fallbackKey = order.customer_phone || order.customer_name || "anonymous";
            const key = customerId || `anon:${fallbackKey}`;

            const existing = customerMap.get(key);
            const createdAt = order.created_at || new Date().toISOString();

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

        // 4) Enrichir avec les profils globaux sans les dupliquer (Supabase)
        const globalIds = Array.from(customerMap.values())
            .map((customer) => customer.id)
            .filter((id) => !id.startsWith("anon:") && id.length > 0);

        if (globalIds.length > 0) {
            const { data: globalProfiles, error: fetchProfilesError } = await supabase
                .from("users")
                .select("id, email, full_name, phone, created_at")
                .in("id", globalIds);

            if (!fetchProfilesError && globalProfiles) {
                const profileById = new Map(globalProfiles.map((profile) => [profile.id, profile]));

                for (const customer of customerMap.values()) {
                    const profile = profileById.get(customer.id);
                    if (!profile) continue;

                    customer.name = profile.full_name || profile.email || customer.name;
                    customer.phone = profile.phone || customer.phone;
                    customer.email = profile.email || null;
                    customer.createdAt = profile.created_at || customer.createdAt;
                }
            }
        }

        // 5) Recherche, tri, pagination côté API
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

        return NextResponse.json({
            customers,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        });
    } catch (error) {
        console.error("Erreur API customers:", error);
        return NextResponse.json(
            { error: "Erreur lors de la récupération des clients" },
            { status: 500 }
        );
    }
}
