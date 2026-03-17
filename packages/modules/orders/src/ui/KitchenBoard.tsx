"use client";

import { useState } from "react";
import { Clock, Utensils, Package, Bike, RefreshCw, CheckCircle2, CalendarClock, Truck } from "lucide-react";
import { Badge, Button, EmptyState, Input, Modal, ModalFooter, Spinner, toast } from "@/components/ui";
import { useOrders, updateOrderStatus } from "@/hooks/use-data";
import { useLocale } from "@/contexts/locale-context";
import { formatOrderId } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Order, OrderItemData } from "@/lib/supabase/types";

// ── Column definitions ────────────────────────────────────────────────────

const COLUMNS: { status: string; labelKey: "pending" | "accepted" | "preparing" | "ready"; nextStatus: string | null; actionKey: "accept" | "startPrep" | "markReady" | "complete" | null }[] = [
    { status: "pending",   labelKey: "pending",   nextStatus: "accepted",  actionKey: "accept"    },
    { status: "accepted",  labelKey: "accepted",  nextStatus: "preparing", actionKey: "startPrep" },
    { status: "preparing", labelKey: "preparing", nextStatus: "ready",     actionKey: "markReady" },
    { status: "ready",     labelKey: "ready",     nextStatus: "delivered", actionKey: "complete"  },
];

const COLUMN_COLORS: Record<string, string> = {
    pending:   "border-t-orange-500 dark:border-t-orange-400",
    accepted:  "border-t-blue-500  dark:border-t-blue-400",
    preparing: "border-t-purple-500 dark:border-t-purple-400",
    ready:     "border-t-green-500  dark:border-t-green-400",
};

const COLUMN_BADGE: Record<string, "warning" | "info" | "brand" | "success"> = {
    pending:   "warning",
    accepted:  "info",
    preparing: "brand",
    ready:     "success",
};

// ── Elapsed time helper ──────────────────────────────────────────────────

function useElapsed(createdAt: string) {
    const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60_000);
    return diff;
}

// ── Order Card ────────────────────────────────────────────────────────────

function OrderCard({ order, nextStatus, actionKey, t }: {
    order: Order;
    nextStatus: string | null;
    actionKey: string | null;
    t: ReturnType<typeof useLocale>["t"];
}) {
    const [loading, setLoading] = useState(false);
    const [showPrepModal, setShowPrepModal] = useState(false);
    const [showDeliveryModal, setShowDeliveryModal] = useState(false);
    const [deliveryNote, setDeliveryNote] = useState("");
    const [prepMinutes, setPrepMinutes] = useState(
        String(order.preparation_time_minutes ?? 25)
    );
    const elapsed = useElapsed(order.created_at);
    const urgent = elapsed >= (t.kds.urgentAfter ? 15 : 15);
    const isScheduled = !!order.scheduled_for;

    const deliveryIcon =
        order.delivery_type === "dine_in" ? <Utensils size={12} /> :
        order.delivery_type === "delivery" ? <Bike size={12} /> :
        <Package size={12} />;

    const deliveryLabel =
        order.delivery_type === "dine_in" ? t.kds.dineIn :
        order.delivery_type === "delivery" ? t.kds.delivery :
        t.kds.pickup;

    async function handleAdvance() {
        if (!nextStatus) return;

        if (actionKey === "accept") {
            setShowPrepModal(true);
            return;
        }

        // For delivery orders going to "delivered", show proof of delivery modal
        if (actionKey === "complete" && order.delivery_type === "delivery") {
            setShowDeliveryModal(true);
            return;
        }

        setLoading(true);
        const { success, error } = await updateOrderStatus(
            order.id,
            nextStatus as Parameters<typeof updateOrderStatus>[1]
        );
        setLoading(false);
        if (!success) {
            toast.error(error ?? "Erreur");
        }
    }

    async function handleAcceptWithPrepTime() {
        const parsedMinutes = Number(prepMinutes);
        if (
            !Number.isFinite(parsedMinutes) ||
            !Number.isInteger(parsedMinutes) ||
            parsedMinutes <= 0 ||
            parsedMinutes > 600
        ) {
            toast.error(t.kds.prepTimeRequired);
            return;
        }

        setLoading(true);
        const { success, error } = await updateOrderStatus(
            order.id,
            "accepted",
            undefined,
            parsedMinutes
        );
        setLoading(false);

        if (!success) {
            toast.error(error ?? "Erreur");
            return;
        }

        setShowPrepModal(false);
    }

    async function handleConfirmDelivery() {
        setLoading(true);
        const { success, error } = await updateOrderStatus(
            order.id,
            "delivered",
            undefined,
            undefined,
            deliveryNote || undefined
        );
        setLoading(false);

        if (!success) {
            toast.error(error ?? "Erreur");
            return;
        }

        toast.success(t.proofOfDelivery.proofRecorded);
        setShowDeliveryModal(false);
        setDeliveryNote("");
    }

    return (
        <div className={cn(
            "bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 p-4 space-y-3 shadow-sm transition-all",
            urgent && "ring-2 ring-orange-400 dark:ring-orange-500"
        )}>
            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="font-bold text-surface-900 dark:text-white text-sm">
                        {t.kds.orderNum} {formatOrderId(order.id)}
                    </p>
                    <p className="text-xs text-surface-500 mt-0.5">{order.customer_name}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div className={cn(
                        "flex items-center gap-1 text-xs font-semibold",
                        urgent ? "text-orange-500" : "text-surface-400"
                    )}>
                        <Clock size={11} />
                        <span>{elapsed} {t.kds.minutes}</span>
                    </div>
                    {order.preparation_time_minutes ? (
                        <p className="text-[11px] font-medium text-brand-600 dark:text-brand-300">
                            {t.kds.prepTimeLabel}: {order.preparation_time_minutes} {t.kds.minutes}
                        </p>
                    ) : null}
                </div>
            </div>

            {/* Delivery type & table */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-surface-500 bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded-full">
                    {deliveryIcon}
                    {deliveryLabel}
                </span>
                {isScheduled && (
                    <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full font-medium">
                        <CalendarClock size={11} />
                        {new Date(order.scheduled_for!).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                )}
                {order.table_number && (
                    <span className="text-xs text-surface-500">
                        {t.kds.table} {order.table_number}
                        {order.covers ? ` · ${order.covers} ${t.kds.covers}` : ""}
                    </span>
                )}
            </div>

            {/* Items */}
            <ul className="space-y-1">
                {(order.items as unknown as OrderItemData[] ?? []).slice(0, 5).map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-surface-700 dark:text-surface-300">
                        <span className="font-bold text-brand-500 w-4 text-center">{item.quantity}×</span>
                        <span className="truncate">{item.productName}</span>
                    </li>
                ))}
                {(order.items as unknown as OrderItemData[] ?? []).length > 5 && (
                    <li className="text-xs text-surface-400">+{(order.items as unknown as OrderItemData[] ?? []).length - 5} {t.kds.items}</li>
                )}
            </ul>

            {/* Action */}
            {nextStatus && actionKey && (
                <Button
                    size="sm"
                    variant="primary"
                    className="w-full"
                    onClick={handleAdvance}
                    disabled={loading}
                >
                    {loading ? <Spinner size="sm" /> : t.kds[actionKey as keyof typeof t.kds]}
                </Button>
            )}
            {!nextStatus && (
                <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-medium justify-center">
                    <CheckCircle2 size={13} />
                    <span>{t.kds.complete}</span>
                </div>
            )}

            <Modal
                isOpen={showPrepModal}
                onClose={() => setShowPrepModal(false)}
                title={t.kds.prepTimeModalTitle}
                description={t.kds.prepTimeModalDesc}
                size="sm"
            >
                <Input
                    type="number"
                    min={1}
                    max={600}
                    step={1}
                    label={t.orders.preparationTime}
                    value={prepMinutes}
                    onChange={(e) => setPrepMinutes(e.target.value)}
                    placeholder={t.orders.preparationTimePlaceholder}
                    hint={t.orders.preparationTimeHint}
                />
                <ModalFooter>
                    <Button variant="outline" onClick={() => setShowPrepModal(false)}>
                        {t.common.back}
                    </Button>
                    <Button variant="primary" onClick={handleAcceptWithPrepTime} isLoading={loading}>
                        {t.kds.prepTimeConfirm}
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Proof of Delivery Modal */}
            <Modal
                isOpen={showDeliveryModal}
                onClose={() => setShowDeliveryModal(false)}
                title={t.proofOfDelivery.confirmDeliveryTitle}
                description={t.proofOfDelivery.confirmDeliveryDesc}
                size="sm"
            >
                <Input
                    label={t.proofOfDelivery.addNote}
                    value={deliveryNote}
                    onChange={(e) => setDeliveryNote(e.target.value)}
                    placeholder={t.proofOfDelivery.notePlaceholder}
                />
                <ModalFooter>
                    <Button variant="outline" onClick={() => setShowDeliveryModal(false)}>
                        {t.common.cancel}
                    </Button>
                    <Button variant="primary" onClick={handleConfirmDelivery} isLoading={loading}>
                        <Truck size={16} className="mr-1.5" />
                        {t.proofOfDelivery.markDelivered}
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
}

// ── KitchenBoard ──────────────────────────────────────────────────────────

export function KitchenBoard() {
    const { t } = useLocale();
    const { orders, isLoading, mutate } = useOrders({
        limit: 200,
        status: "pending,accepted,preparing,ready",
    });

    const activeOrders = orders.filter((o) =>
        ["pending", "accepted", "preparing", "ready"].includes(o.status)
    );

    function handleRefresh() {
        mutate();
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-surface-500">{t.kds.subtitle}</p>
                <Button variant="ghost" size="sm" onClick={handleRefresh} className="gap-2">
                    <RefreshCw size={14} />
                    {t.kds.refresh}
                </Button>
            </div>

            {/* Kanban grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {COLUMNS.map((col) => {
                    const colOrders = activeOrders
                        .filter((o) => o.status === col.status)
                        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

                    return (
                        <div key={col.status} className={cn(
                            "bg-surface-50 dark:bg-surface-950/50 rounded-xl border-2 border-transparent border-t-4 p-3 space-y-3 min-h-[200px]",
                            COLUMN_COLORS[col.status]
                        )}>
                            {/* Column header */}
                            <div className="flex items-center justify-between px-1">
                                <span className="text-sm font-semibold text-surface-700 dark:text-surface-300">
                                    {t.kds[col.labelKey]}
                                </span>
                                <Badge variant={COLUMN_BADGE[col.status]}>
                                    {colOrders.length}
                                </Badge>
                            </div>

                            {/* Cards */}
                            {colOrders.length === 0 ? (
                                <div className="py-8 text-center">
                                    <p className="text-xs text-surface-400">{t.kds.noOrders}</p>
                                </div>
                            ) : (
                                colOrders.map((order) => (
                                    <OrderCard
                                        key={order.id}
                                        order={order}
                                        nextStatus={col.nextStatus}
                                        actionKey={col.actionKey}
                                        t={t}
                                    />
                                ))
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Empty state when no active orders at all */}
            {activeOrders.length === 0 && (
                <EmptyState
                    icon={<Utensils size={32} className="text-surface-400" />}
                    title={t.kds.noOrders}
                    description={t.kds.noOrdersDesc}
                />
            )}
        </div>
    );
}
