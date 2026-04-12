/**
 * Dashboard analytics routes for merchant mobile/web.
 *
 * GET /dashboard/stats   — Compact KPIs + trend chart for dashboard home
 * GET /dashboard/reports — Detailed reporting payload (breakdowns + top products)
 */
import { Hono } from "hono";
import type { Env, Variables } from "../../types";

type DashboardPeriod = "1d" | "7d" | "30d" | "3m" | "90d";

interface NormalizedOrder {
    id: string;
    amount: number;
    status: string;
    paymentStatus: string;
    customerId: string | null;
    deliveryType: string;
    paymentMethod: string;
    createdAtIso: string;
    createdAtMs: number;
    items: unknown;
}

interface CountBreakdown {
    key: string;
    label: string;
    count: number;
    percentage: number;
}

interface RevenueBreakdown {
    key: string;
    label: string;
    count: number;
    revenue: number;
    percentage: number;
}

interface TimeSeriesPoint {
    date: string;
    label: string;
    orders: number;
    revenue: number;
    avgOrderValue: number;
    cancelled: number;
}

interface TopProduct {
    name: string;
    quantity: number;
    revenue: number;
    avgUnitPrice: number;
}

interface PeakHour {
    hour: number;
    label: string;
    orders: number;
    revenue: number;
}

const PERIOD_DAYS: Record<DashboardPeriod, number> = {
    "1d": 1,
    "7d": 7,
    "30d": 30,
    "3m": 90,
    "90d": 90,
};

const DAY_LABELS_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const CANCELLED_STATUSES = new Set(["cancelled", "refunded"]);
const COMPLETED_STATUSES = new Set(["delivered", "completed"]);
const ACTIVE_STATUSES = new Set(["pending", "accepted", "preparing", "ready", "out_for_delivery", "delivering", "scheduled"]);

const STATUS_LABELS: Record<string, string> = {
    draft: "Brouillon",
    scheduled: "Planifiée",
    pending: "En attente",
    accepted: "Acceptée",
    preparing: "En préparation",
    ready: "Prête",
    out_for_delivery: "En livraison",
    delivering: "En livraison",
    delivered: "Livrée",
    completed: "Terminée",
    cancelled: "Annulée",
    refunded: "Remboursée",
};

const DELIVERY_LABELS: Record<string, string> = {
    delivery: "Livraison",
    pickup: "À emporter",
    dine_in: "Sur place",
};

const PAYMENT_LABELS: Record<string, string> = {
    cash: "Espèces",
    mobile_money_mtn: "Mobile Money MTN",
    mobile_money_orange: "Mobile Money Orange",
};

export const dashboardRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

type DashboardContext = {
    var: {
        supabase: Variables["supabase"];
        restaurantId: string;
    };
};

function parsePeriod(raw: string | undefined, fallback: DashboardPeriod): DashboardPeriod {
    if (!raw) return fallback;
    if (raw === "1d" || raw === "7d" || raw === "30d" || raw === "3m" || raw === "90d") return raw;
    return fallback;
}

function asNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function asString(value: unknown): string {
    return typeof value === "string" ? value : "";
}

function asNonEmptyString(value: unknown, fallback: string): string {
    const text = asString(value).trim();
    return text.length > 0 ? text : fallback;
}

function isMissingColumnError(error: unknown): boolean {
    if (!error || typeof error !== "object") return false;
    const message = String((error as { message?: unknown }).message ?? "");
    return message.includes("column") && message.includes("does not exist");
}

function normalizeOrder(row: Record<string, unknown>, nowMs: number): NormalizedOrder {
    const createdAtRaw = asString(row.created_at);
    const createdAtMs = Number.isFinite(Date.parse(createdAtRaw)) ? Date.parse(createdAtRaw) : nowMs;
    const createdAtIso = Number.isFinite(Date.parse(createdAtRaw)) ? new Date(createdAtRaw).toISOString() : new Date(nowMs).toISOString();

    return {
        id: asNonEmptyString(row.id, `${Math.random().toString(36).slice(2, 10)}`),
        amount: asNumber(row.total ?? row.total_amount),
        status: asString(row.status),
        paymentStatus: asString(row.payment_status),
        customerId: asString(row.customer_id) || null,
        deliveryType: asString(row.delivery_type),
        paymentMethod: asString(row.payment_method),
        createdAtIso,
        createdAtMs,
        items: row.items,
    };
}

async function fetchOrders(
    c: DashboardContext,
    sinceIso: string,
    includeItems: boolean,
): Promise<{ orders: NormalizedOrder[]; error: unknown | null }> {
    const supabase = c.var.supabase;
    const restaurantId = c.var.restaurantId;
    const nowMs = Date.now();

    const projections = includeItems
        ? [
            "id,total,status,payment_status,customer_id,created_at,delivery_type,payment_method,items",
            "id,total_amount,status,payment_status,customer_id,created_at,delivery_type,payment_method,items",
            "*",
        ]
        : [
            "id,total,status,payment_status,customer_id,created_at,delivery_type,payment_method",
            "id,total_amount,status,payment_status,customer_id,created_at,delivery_type,payment_method",
            "*",
        ];

    let lastError: unknown = null;

    for (const projection of projections) {
        const { data, error } = await supabase
            .from("orders")
            .select(projection)
            .eq("restaurant_id", restaurantId)
            .gte("created_at", sinceIso)
            .order("created_at", { ascending: false });

        if (!error) {
            const normalized = (data ?? []).map((row) => normalizeOrder(row as unknown as Record<string, unknown>, nowMs));
            return { orders: normalized, error: null };
        }

        lastError = error;
        if (!isMissingColumnError(error)) break;
    }

    return { orders: [], error: lastError };
}

function isCancelled(order: NormalizedOrder): boolean {
    return CANCELLED_STATUSES.has(order.status);
}

function isCompleted(order: NormalizedOrder): boolean {
    return COMPLETED_STATUSES.has(order.status);
}

function isActive(order: NormalizedOrder): boolean {
    return ACTIVE_STATUSES.has(order.status);
}

function isRevenueOrder(order: NormalizedOrder): boolean {
    if (isCancelled(order)) return false;
    if (order.paymentStatus === "refunded") return false;
    if (order.paymentStatus === "paid") return true;
    return isCompleted(order);
}

function startOfDayMs(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function toDayLabel(date: Date, days: number): string {
    if (days <= 7) return DAY_LABELS_FR[date.getDay()];
    return `${date.getDate()}/${date.getMonth() + 1}`;
}

function toDayKey(ms: number): string {
    const d = new Date(ms);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function buildCountBreakdown(
    orders: NormalizedOrder[],
    keyFn: (order: NormalizedOrder) => string,
    labels: Record<string, string>,
): CountBreakdown[] {
    const counts = new Map<string, number>();
    for (const order of orders) {
        const key = keyFn(order) || "unknown";
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const total = Math.max(orders.length, 1);
    return Array.from(counts.entries())
        .map(([key, count]) => ({
            key,
            label: labels[key] ?? key,
            count,
            percentage: Math.round((count / total) * 100),
        }))
        .sort((a, b) => b.count - a.count);
}

function buildRevenueBreakdown(
    revenueOrders: NormalizedOrder[],
    keyFn: (order: NormalizedOrder) => string,
    labels: Record<string, string>,
): RevenueBreakdown[] {
    const grouped = new Map<string, { count: number; revenue: number }>();

    for (const order of revenueOrders) {
        const key = keyFn(order) || "unknown";
        const entry = grouped.get(key) ?? { count: 0, revenue: 0 };
        entry.count += 1;
        entry.revenue += order.amount;
        grouped.set(key, entry);
    }

    const totalRevenue = Math.max(revenueOrders.reduce((sum, order) => sum + order.amount, 0), 1);
    return Array.from(grouped.entries())
        .map(([key, value]) => ({
            key,
            label: labels[key] ?? key,
            count: value.count,
            revenue: Math.round(value.revenue),
            percentage: Math.round((value.revenue / totalRevenue) * 100),
        }))
        .sort((a, b) => b.revenue - a.revenue);
}

function parseItems(raw: unknown): Array<{ name: string; quantity: number; revenue: number }> {
    let source: unknown = raw;

    if (typeof source === "string") {
        try {
            source = JSON.parse(source);
        } catch {
            source = [];
        }
    }

    if (!Array.isArray(source)) return [];

    const parsed: Array<{ name: string; quantity: number; revenue: number }> = [];

    for (const entry of source) {
        if (!entry || typeof entry !== "object") continue;
        const row = entry as Record<string, unknown>;
        const name = asNonEmptyString(row.name ?? row.product_name ?? row.productName ?? row.title, "Article");
        const quantity = Math.max(1, Math.round(asNumber(row.quantity) || 1));
        const unitPrice = asNumber(row.unit_price ?? row.unitPrice ?? row.price);
        const subtotal = asNumber(row.subtotal ?? row.total);
        const revenue = subtotal > 0 ? subtotal : unitPrice * quantity;

        parsed.push({ name, quantity, revenue });
    }

    return parsed;
}

function buildTopProducts(revenueOrders: NormalizedOrder[], limit = 8): TopProduct[] {
    const products = new Map<string, { quantity: number; revenue: number }>();

    for (const order of revenueOrders) {
        for (const item of parseItems(order.items)) {
            const current = products.get(item.name) ?? { quantity: 0, revenue: 0 };
            current.quantity += item.quantity;
            current.revenue += item.revenue;
            products.set(item.name, current);
        }
    }

    return Array.from(products.entries())
        .map(([name, value]) => ({
            name,
            quantity: value.quantity,
            revenue: Math.round(value.revenue),
            avgUnitPrice: value.quantity > 0 ? Math.round(value.revenue / value.quantity) : 0,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit);
}

function buildTimeSeries(orders: NormalizedOrder[], revenueOrders: NormalizedOrder[], days: number, nowMs: number): TimeSeriesPoint[] {
    const daysSafe = Math.max(1, days);
    const dayBuckets = Array.from({ length: daysSafe }, (_, idx) => {
        const dayStart = startOfDayMs(new Date(nowMs - (daysSafe - 1 - idx) * 24 * 60 * 60 * 1000));
        const dayEnd = dayStart + 24 * 60 * 60 * 1000;
        const date = new Date(dayStart);
        const dateKey = toDayKey(dayStart);
        const label = toDayLabel(date, daysSafe);

        const dayOrders = orders.filter((order) => order.createdAtMs >= dayStart && order.createdAtMs < dayEnd);
        const dayRevenueOrders = revenueOrders.filter((order) => order.createdAtMs >= dayStart && order.createdAtMs < dayEnd);
        const revenue = dayRevenueOrders.reduce((sum, order) => sum + order.amount, 0);
        const cancelled = dayOrders.filter(isCancelled).length;

        return {
            date: dateKey,
            label,
            orders: dayOrders.length,
            revenue: Math.round(revenue),
            avgOrderValue: dayRevenueOrders.length > 0 ? Math.round(revenue / dayRevenueOrders.length) : 0,
            cancelled,
        };
    });

    return dayBuckets;
}

function buildPeakHours(revenueOrders: NormalizedOrder[], limit = 8): PeakHour[] {
    const buckets = new Map<number, { orders: number; revenue: number }>();

    for (const order of revenueOrders) {
        const hour = new Date(order.createdAtMs).getHours();
        const current = buckets.get(hour) ?? { orders: 0, revenue: 0 };
        current.orders += 1;
        current.revenue += order.amount;
        buckets.set(hour, current);
    }

    return Array.from(buckets.entries())
        .map(([hour, value]) => ({
            hour,
            label: `${String(hour).padStart(2, "0")}h`,
            orders: value.orders,
            revenue: Math.round(value.revenue),
        }))
        .sort((a, b) => b.orders - a.orders || b.revenue - a.revenue)
        .slice(0, limit);
}

dashboardRoutes.get("/stats", async (c) => {
    const period = parsePeriod(c.req.query("period"), "7d");
    const chartDays = PERIOD_DAYS[period];
    const nowMs = Date.now();
    const now = new Date(nowMs);

    const todayStartMs = startOfDayMs(now);
    const weekStartMs = todayStartMs - 7 * 24 * 60 * 60 * 1000;
    const monthStartMs = startOfDayMs(new Date(now.getFullYear(), now.getMonth(), 1));

    const fetchDays = Math.max(chartDays, 90);
    const fetchSinceIso = new Date(nowMs - fetchDays * 24 * 60 * 60 * 1000).toISOString();

    const { orders, error } = await fetchOrders(c, fetchSinceIso, false);
    if (error) {
        console.error("Stats query error:", error);
        return c.json({ error: "Erreur lors du calcul des statistiques" }, 500);
    }

    const revenueOrders = orders.filter(isRevenueOrder);

    const todayOrders = orders.filter((order) => order.createdAtMs >= todayStartMs);
    const todayRevenueOrders = revenueOrders.filter((order) => order.createdAtMs >= todayStartMs);
    const weekRevenueOrders = revenueOrders.filter((order) => order.createdAtMs >= weekStartMs);
    const monthRevenueOrders = revenueOrders.filter((order) => order.createdAtMs >= monthStartMs);

    const totalRevenue = revenueOrders.reduce((sum, order) => sum + order.amount, 0);
    const totalCancelled = orders.filter(isCancelled).length;
    const totalCompleted = orders.filter(isCompleted).length;
    const totalActive = orders.filter(isActive).length;
    const totalOrders = orders.length;

    const averageOrderValue = revenueOrders.length > 0
        ? Math.round(totalRevenue / revenueOrders.length)
        : 0;

    const completionRate = totalOrders > 0
        ? Math.round((totalCompleted / totalOrders) * 100)
        : 0;

    const cancellationRate = totalOrders > 0
        ? Math.round((totalCancelled / totalOrders) * 100)
        : 0;

    const revenueChart = buildTimeSeries(orders, revenueOrders, chartDays, nowMs).map((point) => ({
        label: point.label,
        value: point.revenue,
        date: point.date,
    }));

    const uniqueCustomers = new Set(
        orders
            .map((order) => order.customerId)
            .filter((customerId): customerId is string => typeof customerId === "string" && customerId.length > 0),
    );

    return c.json({
        stats: {
            revenue: {
                today: Math.round(todayRevenueOrders.reduce((sum, order) => sum + order.amount, 0)),
                week: Math.round(weekRevenueOrders.reduce((sum, order) => sum + order.amount, 0)),
                month: Math.round(monthRevenueOrders.reduce((sum, order) => sum + order.amount, 0)),
            },
            orders: {
                today: todayOrders.length,
                pending: orders.filter((order) => order.status === "pending").length,
                active: totalActive,
                completed: totalCompleted,
                cancelled: totalCancelled,
                total: totalOrders,
            },
            averageOrderValue,
            totalCustomers: uniqueCustomers.size,
            completionRate,
            cancellationRate,
        },
        revenueChart,
        statusBreakdown: buildCountBreakdown(orders, (order) => order.status, STATUS_LABELS),
        deliveryBreakdown: buildRevenueBreakdown(revenueOrders, (order) => order.deliveryType, DELIVERY_LABELS),
    });
});

dashboardRoutes.get("/reports", async (c) => {
    const period = parsePeriod(c.req.query("period"), "30d");
    const days = PERIOD_DAYS[period];
    const nowMs = Date.now();
    const fetchSinceIso = new Date(nowMs - days * 24 * 60 * 60 * 1000).toISOString();

    const { orders, error } = await fetchOrders(c, fetchSinceIso, true);
    if (error) {
        console.error("Reports query error:", error);
        return c.json({ error: "Erreur lors de la génération du rapport" }, 500);
    }

    const revenueOrders = orders.filter(isRevenueOrder);
    const cancelledOrders = orders.filter(isCancelled);
    const completedOrders = orders.filter(isCompleted);
    const activeOrders = orders.filter(isActive);

    const totalOrders = orders.length;
    const totalRevenue = Math.round(revenueOrders.reduce((sum, order) => sum + order.amount, 0));
    const averageOrderValue = revenueOrders.length > 0 ? Math.round(totalRevenue / revenueOrders.length) : 0;
    const completionRate = totalOrders > 0 ? Math.round((completedOrders.length / totalOrders) * 100) : 0;
    const cancellationRate = totalOrders > 0 ? Math.round((cancelledOrders.length / totalOrders) * 100) : 0;

    const uniqueCustomers = new Set(
        orders
            .map((order) => order.customerId)
            .filter((customerId): customerId is string => typeof customerId === "string" && customerId.length > 0),
    );

    const timeSeries = buildTimeSeries(orders, revenueOrders, days, nowMs);
    const topProducts = buildTopProducts(revenueOrders, 10);
    const peakHours = buildPeakHours(revenueOrders, 8);

    return c.json({
        period: period === "3m" ? "90d" : period,
        generatedAt: new Date(nowMs).toISOString(),
        summary: {
            revenue: totalRevenue,
            ordersTotal: totalOrders,
            ordersCompleted: completedOrders.length,
            ordersActive: activeOrders.length,
            ordersCancelled: cancelledOrders.length,
            averageOrderValue,
            completionRate,
            cancellationRate,
            uniqueCustomers: uniqueCustomers.size,
        },
        timeSeries,
        statusBreakdown: buildCountBreakdown(orders, (order) => order.status, STATUS_LABELS),
        deliveryBreakdown: buildRevenueBreakdown(revenueOrders, (order) => order.deliveryType, DELIVERY_LABELS),
        paymentBreakdown: buildRevenueBreakdown(revenueOrders, (order) => order.paymentMethod, PAYMENT_LABELS),
        topProducts,
        peakHours,
    });
});
