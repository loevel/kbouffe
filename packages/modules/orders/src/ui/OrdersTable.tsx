"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Eye, ArrowUpDown, Download } from "lucide-react";
import { Badge, Button, Card, Dropdown, EmptyState, Input, Select, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TablePagination, Tabs, toast, useLocale, formatDate, formatCFA, formatDateTime, formatOrderId } from "@kbouffe/module-core/ui";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { useOrders } from "@/hooks/use-data";

const ITEMS_PER_PAGE = 10;

export function OrdersTable() {
    const { t } = useLocale();
    const [activeTab, setActiveTab] = useState("all");
    const [search, setSearch] = useState("");
    const [paymentFilter, setPaymentFilter] = useState("all");
    const [deliveryFilter, setDeliveryFilter] = useState("all");
    const [sortBy, setSortBy] = useState("newest");
    const [page, setPage] = useState(1);

    const { orders, total, isLoading } = useOrders({
        status: activeTab,
        search: search.trim(),
        page,
        limit: ITEMS_PER_PAGE,
        sort: sortBy,
        payment: paymentFilter,
        delivery: deliveryFilter,
    });

    // Use all orders (no limit) for tab counts
    const { orders: allOrders } = useOrders({ limit: 200 });

    const statusTabs = [
        { id: "all", label: t.orders.allStatuses },
        { id: "pending", label: t.orders.pending, count: allOrders.filter(o => o.status === "pending").length },
        { id: "accepted", label: t.orders.acceptedPlural, count: allOrders.filter(o => o.status === "accepted").length },
        { id: "preparing", label: t.orders.preparingPlural, count: allOrders.filter(o => o.status === "preparing").length },
        { id: "ready", label: t.orders.readyPlural, count: allOrders.filter(o => o.status === "ready").length },
        { id: "completed", label: t.orders.completedPlural },
        { id: "cancelled", label: t.orders.cancelledPlural },
    ];

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
        <Card padding="none">
            <div className="p-4 pb-0">
                <Tabs tabs={statusTabs} activeTab={activeTab} onTabChange={(t) => { setActiveTab(t); setPage(1); }} />
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
                                    <TableCell className="text-surface-500">{formatDateTime(order.created_at)}</TableCell>
                                    <TableCell className="text-right">
                                        <Link
                                            href={`/dashboard/orders/${order.id}`}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
                                        >
                                            <Eye size={16} />
                                            {t.orders.view}
                                        </Link>
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
    );
}
