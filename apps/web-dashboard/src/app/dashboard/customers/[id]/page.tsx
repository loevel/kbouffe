"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Phone, Mail, ShoppingBag, TrendingUp, Calendar, ExternalLink } from "lucide-react";
import { Card, Button, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Spinner, EmptyState } from "@kbouffe/module-core/ui";
import { useLocale } from "@kbouffe/module-core/ui";
import { formatCFA, formatDate, formatPhone, formatOrderId } from "@kbouffe/module-core/ui";
import type { DashboardCustomer } from "@kbouffe/module-crm/ui";
import type { Order } from "@/lib/supabase/types";

export default function CustomerDetailPage() {
    const { t } = useLocale();
    const router = useRouter();
    const params = useParams();
    const customerId = decodeURIComponent(params.id as string);

    const [customer, setCustomer] = useState<DashboardCustomer | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        let active = true;

        async function load() {
            setLoading(true);
            try {
                // Fetch all customers and find the one matching by id
                const res = await fetch(`/api/customers?limit=200`, { cache: "no-store" });
                if (!res.ok) throw new Error("API error");
                const data = await res.json();
                const rows: DashboardCustomer[] = Array.isArray(data.customers) ? data.customers : [];
                const found = rows.find((c) => c.id === customerId || c.phone === customerId);
                if (!active) return;

                if (!found) {
                    setNotFound(true);
                    setLoading(false);
                    return;
                }
                setCustomer(found);

                // Fetch orders for this customer using name search
                const ordersRes = await fetch(`/api/orders?search=${encodeURIComponent(found.name)}&limit=100`, { cache: "no-store" });
                if (ordersRes.ok) {
                    const ordersData = await ordersRes.json();
                    const allOrders: Order[] = ordersData.orders ?? [];
                    // Filter to exact customer match based on phone or id
                    const customerOrders = allOrders.filter((o) =>
                        (found.phone && o.customer_phone === found.phone) ||
                        (found.id && o.customer_id === found.id)
                    );
                    if (!active) return;
                    setOrders(customerOrders.length > 0 ? customerOrders : allOrders);
                }
            } catch {
                if (active) setNotFound(true);
            } finally {
                if (active) setLoading(false);
            }
        }

        load();
        return () => { active = false; };
    }, [customerId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Spinner size="lg" />
            </div>
        );
    }

    if (notFound || !customer) {
        return (
            <div className="space-y-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
                    <ArrowLeft size={16} /> {t.customers.backToCustomers}
                </Button>
                <EmptyState title={t.common.noResults} description="" />
            </div>
        );
    }

    const avgOrder = customer.totalOrders > 0 ? customer.totalSpent / customer.totalOrders : 0;

    return (
        <>
            {/* Header */}
            <div className="mb-6">
                <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/customers")} className="gap-2 mb-4">
                    <ArrowLeft size={16} />
                    {t.customers.backToCustomers}
                </Button>

                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 text-xl font-bold">
                        {customer.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{customer.name}</h1>
                        <p className="text-surface-500 dark:text-surface-400 mt-0.5">{t.customers.detail}</p>
                    </div>
                </div>
            </div>

            {/* Contact info */}
            <Card className="mb-6">
                <div className="flex flex-wrap gap-6">
                    {customer.phone && (
                        <div className="flex items-center gap-2 text-sm">
                            <Phone size={16} className="text-surface-400" />
                            <span className="text-surface-700 dark:text-surface-300">{formatPhone(customer.phone)}</span>
                        </div>
                    )}
                    {customer.email && (
                        <div className="flex items-center gap-2 text-sm">
                            <Mail size={16} className="text-surface-400" />
                            <span className="text-surface-700 dark:text-surface-300">{customer.email}</span>
                        </div>
                    )}
                    {customer.createdAt && (
                        <div className="flex items-center gap-2 text-sm">
                            <Calendar size={16} className="text-surface-400" />
                            <span className="text-surface-500">{t.customers.customerSince} {formatDate(customer.createdAt)}</span>
                        </div>
                    )}
                </div>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="p-4">
                    <p className="text-xs text-surface-500 dark:text-surface-400">{t.customers.totalOrders}</p>
                    <p className="text-2xl font-bold text-surface-900 dark:text-white mt-1">{customer.totalOrders}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-xs text-surface-500 dark:text-surface-400">{t.customers.totalSpent}</p>
                    <p className="text-2xl font-bold text-surface-900 dark:text-white mt-1">{formatCFA(customer.totalSpent)}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-xs text-surface-500 dark:text-surface-400">{t.customers.avgOrder}</p>
                    <p className="text-2xl font-bold text-surface-900 dark:text-white mt-1">{formatCFA(avgOrder)}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-xs text-surface-500 dark:text-surface-400">{t.customers.firstOrder}</p>
                    <p className="text-lg font-bold text-surface-900 dark:text-white mt-1">{customer.createdAt ? formatDate(customer.createdAt) : "-"}</p>
                </Card>
            </div>

            {/* Order history */}
            <Card padding="none">
                <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-800 flex items-center gap-2">
                    <ShoppingBag size={16} className="text-surface-400" />
                    <h2 className="font-semibold text-surface-900 dark:text-white">{t.customers.orderHistory}</h2>
                </div>

                {orders.length === 0 ? (
                    <div className="p-8 text-center">
                        <EmptyState
                            icon={<TrendingUp size={28} className="text-surface-400" />}
                            title={t.customers.noOrderHistory}
                            description=""
                        />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t.orders.colOrder}</TableHead>
                                <TableHead>{t.orders.colAmount}</TableHead>
                                <TableHead>{t.orders.colStatus}</TableHead>
                                <TableHead>{t.orders.colDate}</TableHead>
                                <TableHead>{t.common.actions}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium text-surface-900 dark:text-white">
                                        {formatOrderId(order.id)}
                                    </TableCell>
                                    <TableCell>{formatCFA(order.total)}</TableCell>
                                    <TableCell>
                                        <Badge variant={order.status === "completed" ? "success" : order.status === "cancelled" ? "default" : "warning"}>
                                            {t.orders[order.status as keyof typeof t.orders] as string ?? order.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-surface-500">{formatDate(order.created_at)}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                                            className="gap-1.5"
                                        >
                                            <ExternalLink size={13} />
                                            {t.customers.viewOrder}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>
        </>
    );
}
