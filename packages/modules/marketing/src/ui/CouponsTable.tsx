"use client";

import { useState } from "react";
import { Tag, ToggleLeft, ToggleRight, Trash2, Pencil } from "lucide-react";
import {
    Card,
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
    Badge, Button, EmptyState, toast,
} from "@/components/ui";
import { useCoupons } from "@/hooks/use-data";
import { useLocale } from "@/contexts/locale-context";
import { formatCFA, formatDate } from "@/lib/format";
import type { Coupon } from "@/lib/supabase/types";
import { CouponFormModal } from "./CouponFormModal";

export function CouponsTable() {
    const { t } = useLocale();
    const { coupons, isLoading, updateCoupon, deleteCoupon } = useCoupons();
    const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);
    const [showModal, setShowModal] = useState(false);

    async function handleToggle(coupon: Coupon) {
        try {
            await updateCoupon(coupon.id, { is_active: !coupon.is_active });
        } catch {
            toast.error("Erreur lors de la mise à jour");
        }
    }

    async function handleDelete(coupon: Coupon) {
        if (!confirm(t.coupons.deleteConfirm)) return;
        try {
            await deleteCoupon(coupon.id);
            toast.success(t.coupons.deleted);
        } catch {
            toast.error("Erreur lors de la suppression");
        }
    }

    function getCouponStatus(coupon: Coupon): { label: string; variant: "success" | "warning" | "default" } {
        if (!coupon.is_active) return { label: t.common.inactive, variant: "default" };
        const now = new Date();
        if (coupon.starts_at && new Date(coupon.starts_at) > now) return { label: t.coupons.notStarted, variant: "warning" };
        if (coupon.expires_at && new Date(coupon.expires_at) < now) return { label: t.coupons.expired, variant: "default" };
        return { label: t.common.active, variant: "success" };
    }

    return (
        <>
            <Card padding="none">
                <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between">
                    <h3 className="font-semibold text-surface-900 dark:text-white">{t.coupons.title}</h3>
                    <Button
                        size="sm"
                        leftIcon={<Tag size={14} />}
                        onClick={() => { setEditCoupon(null); setShowModal(true); }}
                    >
                        {t.coupons.new}
                    </Button>
                </div>

                {isLoading ? (
                    <div className="p-12 text-center text-surface-400">{t.common.loading}…</div>
                ) : coupons.length === 0 ? (
                    <EmptyState
                        icon={<Tag size={40} />}
                        title={t.coupons.empty}
                        description={t.coupons.emptyDesc}
                        action={
                            <Button onClick={() => { setEditCoupon(null); setShowModal(true); }}>
                                {t.coupons.new}
                            </Button>
                        }
                    />
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t.coupons.colCode}</TableHead>
                                <TableHead>{t.coupons.colDiscount}</TableHead>
                                <TableHead>{t.coupons.colUses}</TableHead>
                                <TableHead>{t.coupons.colValidity}</TableHead>
                                <TableHead>{t.coupons.colAppliesTo}</TableHead>
                                <TableHead>{t.coupons.colStatus}</TableHead>
                                <TableHead>{t.common.actions}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {coupons.map((coupon: any) => {
                                const status = getCouponStatus(coupon);
                                const appliesToLabel =
                                    coupon.applies_to === "delivery" ? t.coupons.appliesToDelivery
                                    : coupon.applies_to === "pickup" ? t.coupons.appliesToPickup
                                    : coupon.applies_to === "dine_in" ? t.coupons.appliesToDineIn
                                    : t.coupons.appliesToAll;

                                return (
                                    <TableRow key={coupon.id}>
                                        <TableCell>
                                            <code className="bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded text-sm font-mono font-bold">
                                                {coupon.code}
                                            </code>
                                            <div className="text-xs text-surface-500 mt-0.5">{coupon.name}</div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {coupon.type === "percent"
                                                ? `-${coupon.value}%`
                                                : `-${formatCFA(coupon.value)}`}
                                            {coupon.max_discount && (
                                                <div className="text-xs text-surface-400">
                                                    max {formatCFA(coupon.max_discount)}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {coupon.current_uses}
                                            {coupon.max_uses
                                                ? ` / ${coupon.max_uses}`
                                                : ` / ${t.coupons.unlimited}`}
                                        </TableCell>
                                        <TableCell className="text-sm text-surface-500">
                                            {coupon.starts_at ? formatDate(coupon.starts_at) : "—"}
                                            {" → "}
                                            {coupon.expires_at ? formatDate(coupon.expires_at) : t.coupons.unlimited}
                                        </TableCell>
                                        <TableCell className="text-sm">{appliesToLabel}</TableCell>
                                        <TableCell>
                                            <Badge variant={status.variant}>{status.label}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleToggle(coupon)}
                                                    className="p-1.5 rounded hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500"
                                                    title={coupon.is_active ? "Désactiver" : "Activer"}
                                                >
                                                    {coupon.is_active
                                                        ? <ToggleRight size={16} className="text-brand-500" />
                                                        : <ToggleLeft size={16} />}
                                                </button>
                                                <button
                                                    onClick={() => { setEditCoupon(coupon); setShowModal(true); }}
                                                    className="p-1.5 rounded hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500"
                                                    title="Modifier"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(coupon)}
                                                    className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </Card>

            <CouponFormModal
                isOpen={showModal}
                coupon={editCoupon}
                onClose={() => setShowModal(false)}
            />
        </>
    );
}
