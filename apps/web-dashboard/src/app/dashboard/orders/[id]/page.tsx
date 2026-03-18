"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Phone, User, Truck, Store, StickyNote } from "lucide-react";
import { Card, Badge, Button } from "@kbouffe/module-core/ui";
import { ordersUi } from "@kbouffe/module-orders";
import { useOrder, type OrderStatus } from "@kbouffe/module-orders/ui";
const { OrderStatusBadge, OrderTimeline, OrderActions, OrderChat, AssignDriver } = ordersUi;
import { formatCFA, formatDateTime, formatOrderId, formatPhone, getPaymentLabel, getPaymentStatusLabel, type OrderItemData } from "@kbouffe/module-core/ui";
import { useLocale } from "@kbouffe/module-core/ui";

export default function OrderDetailPage() {
    const params = useParams();
    const { t } = useLocale();
    const orderId = params.id as string;
    const { order, isLoading, mutate } = useOrder(orderId);
    const [status, setStatus] = useState<OrderStatus | null>(null);

    // Use local status if changed, otherwise use API data
    const currentStatus = status ?? order?.status ?? "pending";

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-6">
                <div className="h-8 bg-surface-200 dark:bg-surface-700 rounded w-48" />
                <div className="h-4 bg-surface-100 dark:bg-surface-800 rounded w-32" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-64 bg-surface-100 dark:bg-surface-800 rounded-xl" />
                    <div className="h-64 bg-surface-100 dark:bg-surface-800 rounded-xl" />
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="text-center py-16">
                <h2 className="text-xl font-semibold text-surface-900 dark:text-white">{t.orders.orderNotFound}</h2>
                <Link href="/dashboard/orders" className="text-brand-500 hover:underline mt-2 inline-block">{t.orders.backToOrders}</Link>
            </div>
        );
    }

    const items = order.items as unknown as OrderItemData[];

    const handleStatusChange = (newStatus: OrderStatus) => {
        setStatus(newStatus);
        mutate();
    };

    return (
        <>
            <div className="mb-6">
                <Link href="/dashboard/orders" className="inline-flex items-center gap-2 text-sm text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 mb-4">
                    <ArrowLeft size={16} />
                    {t.orders.backToOrders}
                </Link>
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{formatOrderId(order.id)}</h1>
                        <OrderStatusBadge status={currentStatus} />
                    </div>
                    <OrderActions orderId={orderId} status={currentStatus} onStatusChange={handleStatusChange} />
                </div>
                <p className="text-surface-500 dark:text-surface-400 mt-1">{formatDateTime(order.created_at)}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card padding="none">
                        <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-800">
                            <h3 className="font-semibold text-surface-900 dark:text-white">{t.orders.orderedProducts}</h3>
                        </div>
                        <div className="divide-y divide-surface-100 dark:divide-surface-800">
                            {items.map((item, i) => (
                                <div key={i} className="px-6 py-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-400 text-sm font-bold">
                                            {item.quantity}x
                                        </div>
                                        <div>
                                            <p className="font-medium text-surface-900 dark:text-white">{item.productName}</p>
                                            {item.selectedOptions && (
                                                <p className="text-xs text-surface-500 mt-0.5">
                                                    {Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <p className="font-medium text-surface-900 dark:text-white">{formatCFA(item.unitPrice * item.quantity)}</p>
                                </div>
                            ))}
                        </div>
                        <div className="px-6 py-4 bg-surface-50 dark:bg-surface-800/50 border-t border-surface-100 dark:border-surface-800 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-surface-500">{t.common.subtotal}</span>
                                <span className="text-surface-900 dark:text-white">{formatCFA(order.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-surface-500">{t.orders.deliveryFee}</span>
                                <span className="text-surface-900 dark:text-white">{order.delivery_fee > 0 ? formatCFA(order.delivery_fee) : t.common.free}</span>
                            </div>
                            <div className="flex justify-between font-semibold text-lg pt-2 border-t border-surface-200 dark:border-surface-700">
                                <span className="text-surface-900 dark:text-white">{t.common.total}</span>
                                <span className="text-brand-600 dark:text-brand-400">{formatCFA(order.total)}</span>
                            </div>
                        </div>
                    </Card>

                    {order.notes && (
                        <Card>
                            <div className="flex items-center gap-2 mb-2">
                                <StickyNote size={18} className="text-surface-400" />
                                <h3 className="font-semibold text-surface-900 dark:text-white">{t.orders.customerNotes}</h3>
                            </div>
                            <p className="text-surface-600 dark:text-surface-300">{order.notes}</p>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    <Card>
                        <h3 className="font-semibold text-surface-900 dark:text-white mb-4">{t.orders.customer}</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <User size={16} className="text-surface-400 shrink-0" />
                                <span className="text-sm text-surface-700 dark:text-surface-300">{order.customer_name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone size={16} className="text-surface-400 shrink-0" />
                                <span className="text-sm text-surface-700 dark:text-surface-300">{formatPhone(order.customer_phone)}</span>
                            </div>
                        </div>
                    </Card>

                    <OrderChat orderId={orderId} customerName={order.customer_name} />

                    <Card>
                        <h3 className="font-semibold text-surface-900 dark:text-white mb-4">{t.orders.delivery}</h3>
                        <div className="flex items-center gap-2 mb-3">
                            {order.delivery_type === "delivery" ? (
                                <Badge variant="info"><Truck size={12} className="mr-1" /> {t.orders.delivery}</Badge>
                            ) : (
                                <Badge variant="default"><Store size={12} className="mr-1" /> {t.orders.pickup}</Badge>
                            )}
                        </div>
                        {order.delivery_address && (
                            <div className="flex items-start gap-3">
                                <MapPin size={16} className="text-surface-400 shrink-0 mt-0.5" />
                                <span className="text-sm text-surface-700 dark:text-surface-300">{order.delivery_address}</span>
                            </div>
                        )}
                        
                        {order.delivery_type === "delivery" && (
                            <AssignDriver 
                                orderId={orderId} 
                                currentDriverId={(order as any).driver_id} 
                                onAssigned={() => mutate()} 
                            />
                        )}
                    </Card>

                    <Card>
                        <h3 className="font-semibold text-surface-900 dark:text-white mb-4">{t.orders.payment}</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-surface-500">{t.orders.paymentMode}</span>
                                <span className="text-sm font-medium text-surface-900 dark:text-white">
                                    {getPaymentLabel(order.payment_method)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-surface-500">{t.orders.paymentStatus}</span>
                                <Badge variant={order.payment_status === "paid" ? "success" : order.payment_status === "pending" ? "warning" : "danger"}>
                                    {getPaymentStatusLabel(order.payment_status)}
                                </Badge>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <h3 className="font-semibold text-surface-900 dark:text-white mb-4">{t.orders.progression}</h3>
                        <OrderTimeline currentStatus={currentStatus} createdAt={order.created_at} />
                    </Card>
                </div>
            </div>
        </>
    );
}
