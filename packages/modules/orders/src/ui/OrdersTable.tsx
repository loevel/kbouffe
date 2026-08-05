"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Eye, ArrowUpDown, CalendarClock, Download, RotateCcw } from "lucide-react";
import { Badge, Button, Card, Dropdown, EmptyState, Input, Select, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TablePagination, Tabs, toast, useLocale, formatDate, formatCFA, formatDateTime, formatOrderId, type Order } from "@kbouffe/module-core/ui";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { useOrders, useOrderStatusCounts } from "../hooks/use-orders";
import { RefundModal } from "./components/RefundModal";

const ITEMS_PER_PAGE = 10;

const VALID_STATUS_TABS = ["all", "scheduled", "pending", "accepted", "preparing", "ready", "completed", "cancelled"];

export function OrdersTable() {
    const { t } = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const statusFromUrl = searchParams?.get("status") ?? null;
    const [activeTab, setActiveTab] = useState(
        () => (statusFromUrl && VALID_STATUS_TABS.includes(statusFromUrl) ? statusFromUrl : "all")
    );
    const [search, setSearch] = useState("");
    const [paymentFilter, setPaymentFilter] = useState("all");
    const [deliveryFilter, setDeliveryFilter] = useState("all");
    const [sortBy, setSortBy] = useState("newest");
    const [page, setPage] = useState(1);
    // Refund modal state
    const [orderToRefund, setOrderToRefund] = useState<Order | null>(null);

    // Keep the tab in sync when the query string changes without a full
    // remount — e.g. clicking the "Pending orders" quick-action link while
    // already on /dashboard/orders only updates the query, it doesn't
    // recreate this component, so the tab must react to it explicitly.
    useEffect(() => {
        if (statusFromUrl && VALID_STATUS_TABS.includes(statusFromUrl)) {
            setActiveTab(statusFromUrl);
            setPage(1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFromUrl]);

    // The "completed" tab id is a UI grouping, not a real order status — the
    // live order flow only ever reaches "delivered" (see ALLOWED_TRANSITIONS
    // in orders.ts), while "completed" is a legacy/dashboard-KPI-only value
    // (see COMPLETED_STATUSES in dashboard.ts). Map it to both so the tab
    // actually shows the delivered orders users expect, instead of staying
    // empty.
    const statusQuery = activeTab === "completed" ? "delivered,completed" : activeTab;

    const { orders, total, isLoading } = useOrders({
        status: statusQuery,
        search: search.trim(),
        page,
        limit: ITEMS_PER_PAGE,
        sort: sortBy,
        payment: paymentFilter,
        delivery: deliveryFilter,
    });

    // Exact per-status counts from the DB (see useOrderStatusCounts) —
    // previously derived by client-filtering a 200-row sample, which
    // silently under-counted every tab (Cancelled had no count at all) past
    // 200 total orders.
    const { counts } = useOrderStatusCounts();

    const statusTabs = [
        { id: "all", label: t.orders.allStatuses },
        ...(counts.scheduled > 0 ? [{ id: "scheduled", label: t.orders.scheduled, count: counts.scheduled }] : []),
        { id: "pending", label: t.orders.pending, count: counts.pending },
        { id: "accepted", label: t.orders.acceptedPlural, count: counts.accepted },
        { id: "preparing", label: t.orders.preparingPlural, count: counts.preparing },
        { id: "ready", label: t.orders.readyPlural, count: counts.ready },
        { id: "completed", label: t.orders.completedPlural, count: counts.completed },
        { id: "cancelled", label: t.orders.cancelledPlural, count: counts.cancelled },
    ];

    // Clicking a tab now also reflects the selection in the URL (?status=…)
    // so the filter is shareable/bookmarkable and survives a refresh —
    // previously only the initial URL was read, tab clicks left it stale.
    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setPage(1);
        const params = new URLSearchParams(searchParams?.toString() ?? "");
        if (tab === "all") {
            params.delete("status");
        } else {
            params.set("status", tab);
        }
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : (pathname ?? "/dashboard/orders"), { scroll: false });
    };

    const filtered = useMemo(() => {
        // Server already handles filtering, sorting, and pagination
        // We just use the orders as-is from the API
        return orders;
    }, [orders]);

    const paymentOptions = [
        { value: "all", label: t.orders.filterPaymentAll },
        { value: "paid", label: t.orders.filterPaymentPaid },
        { value: "pending", label: t.orders.filterPaymentPending },
        { value: "failed", label: t.orders.filterPaymentFailed },
        { value: "refunded", label: t.orders.filterPaymentRefunded },
    ];

    const deliveryOptions = [
        { value: "all", label: t.orders.filterDeliveryAll },
        { value: "delivery", label: t.orders.filterDeliveryDelivery },
        { value: "pickup", label: t.orders.filterDeliveryPickup },
        { value: "dine_in", label: t.orders.filterDeliveryDineIn },
    ];

    const sortOptions = [
        { value: "newest", label: t.orders.sortNewest },
        { value: "oldest", label: t.orders.sortOldest },
        { value: "amount_desc", label: t.orders.sortAmountDesc },
        { value: "amount_asc", label: t.orders.sortAmountAsc },
    ];

    const hasActiveFilters = search.trim() || paymentFilter !== "all" || deliveryFilter !== "all" || sortBy !== "newest";

    const clearFilters = () => {
        setSearch("");
        setPaymentFilter("all");
        setDeliveryFilter("all");
        setSortBy("newest");
        setPage(1);
    };

    const exportCsv = () => {
        const headers = [
            t.orders.colOrder,
            t.orders.colCustomer,
            t.orders.colAmount,
            t.orders.colStatus,
            t.orders.colDate,
        ];

        const rows = filtered.map((order) => [
            formatOrderId(order.id),
            order.customer_name,
            String(order.total),
            t.orders[order.status],
            formatDateTime(order.created_at),
        ]);

        const csvContent = [headers, ...rows]
            .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
            .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `orders-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success(t.orders.exportSuccess);
    };

    const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
    const paginated = filtered;

    return (
        <>
        <Card padding="none">
            <div className="p-4 pb-0">
                <Tabs tabs={statusTabs} activeTab={activeTab} onTabChange={handleTabChange} />
            </div>
            <div className="p-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                    <div className="lg:col-span-5">
                        <Input
                            placeholder={t.orders.searchPlaceholder}
                            leftIcon={<Search size={18} />}
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>
                    <div className="lg:col-span-2">
                        <Select value={paymentFilter} onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }} options={paymentOptions} />
                    </div>
                    <div className="lg:col-span-2">
                        <Select value={deliveryFilter} onChange={(e) => { setDeliveryFilter(e.target.value); setPage(1); }} options={deliveryOptions} />
                    </div>
                    <div className="lg:col-span-3 flex gap-2">
                        <div className="flex-1">
                            <Select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }} options={sortOptions} />
                        </div>
                        <Button variant="outline" size="sm" leftIcon={<Download size={14} />} onClick={exportCsv}>
                            CSV
                        </Button>
                    </div>
                </div>
                {hasActiveFilters && (
                    <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="text-xs text-surface-500 dark:text-surface-400 flex items-center gap-1">
                            <ArrowUpDown size={12} />
                            {total} {t.orders.filteredResults}
                        </span>
                        <Button variant="ghost" size="sm" onClick={clearFilters}>{t.orders.clearFilters}</Button>
                    </div>
                )}
            </div>
            {paginated.length === 0 ? (
                <EmptyState title={t.orders.noOrders} description={t.orders.noOrdersFilter} />
            ) : (
                <>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t.orders.colOrder}</TableHead>
                                <TableHead>{t.orders.colCustomer}</TableHead>
                                <TableHead>{t.orders.colAmount}</TableHead>
                                <TableHead>{t.orders.colStatus}</TableHead>
                                <TableHead>{t.orders.colDate}</TableHead>
                                <TableHead className="text-right">{t.common.actions}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginated.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium text-surface-900 dark:text-white">{formatOrderId(order.id)}</TableCell>
                                    <TableCell>{order.customer_name}</TableCell>
                                    <TableCell className="font-medium">{formatCFA(order.total)}</TableCell>
                                    <TableCell><OrderStatusBadge status={order.status} /></TableCell>
                                    <TableCell className="text-surface-500">
                                        {order.status === "scheduled" && "scheduled_for" in order && order.scheduled_for ? (
                                            <span className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 font-medium">
                                                <CalendarClock size={13} />
                                                {formatDateTime(String(order.scheduled_for))}
                                            </span>
                                        ) : (
                                            formatDateTime(order.created_at)
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="inline-flex items-center gap-2 justify-end">
                                            {/* Badge "Remboursé" */}
                                            {order.payment_status === "refunded" && (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg">
                                                    <RotateCcw size={11} />
                                                    {t.orders.refunded}
                                                </span>
                                            )}
                                            {/* Bouton Rembourser */}
                                            {order.payment_status === "paid" && order.status !== "cancelled" && (
                                                <button
                                                    onClick={() => setOrderToRefund(order)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                                                    aria-label={`${t.orders.refundOrder} ${formatOrderId(order.id)}`}
                                                >
                                                    <RotateCcw size={12} />
                                                    {t.orders.refundOrder}
                                                </button>
                                            )}
                                            <Link
                                                href={`/dashboard/orders/${order.id}`}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
                                            >
                                                <Eye size={16} />
                                                {t.orders.view}
                                            </Link>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {totalPages > 1 && (
                        <TablePagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                    )}
                </>
            )}
        </Card>

        {/* Refund modal — rendered outside the Card to avoid z-index issues */}
        {orderToRefund && (
            <RefundModal
                open={!!orderToRefund}
                onClose={() => setOrderToRefund(null)}
                order={{
                    id: orderToRefund.id,
                    total: orderToRefund.total,
                    payment_method: orderToRefund.payment_method,
                    payment_status: orderToRefund.payment_status,
                }}
                onSuccess={() => {
                    setOrderToRefund(null);
                    // SWR global revalidation est géré dans RefundModal via authFetch
                }}
            />
        )}
        </>
    );
}
