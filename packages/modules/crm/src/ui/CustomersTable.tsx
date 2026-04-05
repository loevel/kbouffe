"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, Download, Search, Users } from "lucide-react";
import { Button, Card, Input, Select, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TablePagination, EmptyState, toast, useLocale, formatCFA, formatDate, formatPhone } from "@kbouffe/module-core/ui";
import { useCustomers } from "./hooks";

const ITEMS_PER_PAGE = 10;

export function CustomersTable() {
    const { t } = useLocale();
    const [search, setSearch] = useState("");
    const { customers, isLoading } = useCustomers();
    const [sortBy, setSortBy] = useState("newest");
    const [page, setPage] = useState(1);

    const filtered = useMemo(() => {
        let rows = customers;

        if (search.trim()) {
            const q = search.toLowerCase();
            rows = rows.filter(
                (c) =>
                    c.name.toLowerCase().includes(q) ||
                    c.phone.includes(q) ||
                    (c.email ?? "").toLowerCase().includes(q)
            );
        }

        if (sortBy === "name") {
            rows = [...rows].sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortBy === "orders") {
            rows = [...rows].sort((a, b) => b.totalOrders - a.totalOrders);
        } else if (sortBy === "spent") {
            rows = [...rows].sort((a, b) => b.totalSpent - a.totalSpent);
        } else {
            rows = [...rows].sort(
                (a, b) => new Date(b.createdAt ?? b.lastOrderAt).getTime() - new Date(a.createdAt ?? a.lastOrderAt).getTime()
            );
        }

        return rows;
    }, [customers, search, sortBy]);

    const sortOptions = [
        { value: "newest", label: t.customers.sortNewest },
        { value: "name", label: t.customers.sortName },
        { value: "orders", label: t.customers.sortOrders },
        { value: "spent", label: t.customers.sortSpent },
    ];

    const hasActiveFilters = search.trim() || sortBy !== "newest";

    function clearFilters() {
        setSearch("");
        setSortBy("newest");
        setPage(1);
    }

    function exportCsv() {
        const headers = [
            t.customers.name,
            t.customers.phone,
            t.customers.email,
            t.customers.totalOrders,
            t.customers.totalSpent,
            t.customers.lastOrder,
        ];
        const rows = filtered.map((customer) => [
            customer.name,
            customer.phone,
            customer.email ?? "",
            String(customer.totalOrders),
            String(customer.totalSpent),
            formatDate(customer.lastOrderAt),
        ]);

        const csvContent = [headers, ...rows]
            .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
            .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `customers-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success(t.customers.exportSuccess);
    }

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    return (
        <Card padding="none">
            <div className="p-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                    <div className="lg:col-span-8">
                        <Input
                            placeholder={t.customers.searchPlaceholder}
                            leftIcon={<Search size={18} />}
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                    <div className="lg:col-span-2">
                        <Select
                            value={sortBy}
                            onChange={(e) => {
                                setSortBy(e.target.value);
                                setPage(1);
                            }}
                            options={sortOptions}
                        />
                    </div>
                    <div className="lg:col-span-2">
                        <Button variant="outline" size="sm" leftIcon={<Download size={14} />} onClick={exportCsv} className="w-full">
                            CSV
                        </Button>
                    </div>
                </div>
                {hasActiveFilters && (
                    <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="text-xs text-surface-500 dark:text-surface-400 flex items-center gap-1">
                            <ArrowUpDown size={12} />
                            {filtered.length} {t.customers.filteredResults}
                        </span>
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                            {t.customers.clearFilters}
                        </Button>
                    </div>
                )}
            </div>

            {isLoading ? (
                <div className="p-6 space-y-3">
                    <div className="h-10 rounded bg-surface-100 dark:bg-surface-800 animate-pulse" />
                    <div className="h-10 rounded bg-surface-100 dark:bg-surface-800 animate-pulse" />
                    <div className="h-10 rounded bg-surface-100 dark:bg-surface-800 animate-pulse" />
                </div>
            ) : paginated.length === 0 ? (
                <EmptyState icon={<Users size={32} />} title={t.customers.noCustomers} description={t.customers.noCustomersHint} />
            ) : (
                <>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t.customers.name}</TableHead>
                                <TableHead>{t.customers.phone}</TableHead>
                                <TableHead>{t.customers.email}</TableHead>
                                <TableHead>{t.customers.totalOrders}</TableHead>
                                <TableHead>{t.customers.totalSpent}</TableHead>
                                <TableHead>{t.customers.lastOrder}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginated.map((customer) => (
                                <TableRow key={customer.id}>
                                    <TableCell>
                                        <Link href={`/dashboard/customers/${encodeURIComponent(customer.id)}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                            <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 text-sm font-bold">
                                                {customer.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                            </div>
                                            <span className="font-medium text-surface-900 dark:text-white">{customer.name}</span>
                                        </Link>
                                    </TableCell>
                                    <TableCell>{customer.phone ? formatPhone(customer.phone) : "-"}</TableCell>
                                    <TableCell>{customer.email ?? "-"}</TableCell>
                                    <TableCell className="font-medium">{customer.totalOrders}</TableCell>
                                    <TableCell className="font-medium">{formatCFA(customer.totalSpent)}</TableCell>
                                    <TableCell className="text-surface-500">{formatDate(customer.lastOrderAt)}</TableCell>
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
