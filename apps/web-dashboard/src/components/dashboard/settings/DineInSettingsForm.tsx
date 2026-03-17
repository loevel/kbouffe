"use client";

import { useEffect, useState } from "react";
import { Armchair } from "lucide-react";
import { Card, Button, Input, Toggle, Select, toast } from "@/components/ui";
import { useDashboard } from "@/contexts/dashboard-context";
import { useLocale } from "@/contexts/locale-context";

export function DineInSettingsForm() {
    const { restaurant, updateRestaurant } = useDashboard();
    const { t } = useLocale();

    const [form, setForm] = useState({
        has_dine_in: restaurant?.has_dine_in ?? false,
        has_reservations: restaurant?.has_reservations ?? false,
        corkage_fee_amount: restaurant?.corkage_fee_amount?.toString() ?? "0",
        dine_in_service_fee: restaurant?.dine_in_service_fee?.toString() ?? "0",
        reservation_cancel_policy: restaurant?.reservation_cancel_policy ?? "flexible",
        reservation_cancel_notice_minutes: restaurant?.reservation_cancel_notice_minutes?.toString() ?? "120",
        reservation_cancellation_fee_amount: restaurant?.reservation_cancellation_fee_amount?.toString() ?? "0",
        order_cancel_policy: restaurant?.order_cancel_policy ?? "flexible",
        order_cancel_notice_minutes: restaurant?.order_cancel_notice_minutes?.toString() ?? "30",
        order_cancellation_fee_amount: restaurant?.order_cancellation_fee_amount?.toString() ?? "0",
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!restaurant) return;
        setForm({
            has_dine_in: restaurant.has_dine_in ?? false,
            has_reservations: restaurant.has_reservations ?? false,
            corkage_fee_amount: restaurant.corkage_fee_amount?.toString() ?? "0",
            dine_in_service_fee: restaurant.dine_in_service_fee?.toString() ?? "0",
            reservation_cancel_policy: restaurant.reservation_cancel_policy ?? "flexible",
            reservation_cancel_notice_minutes: restaurant.reservation_cancel_notice_minutes?.toString() ?? "120",
            reservation_cancellation_fee_amount: restaurant.reservation_cancellation_fee_amount?.toString() ?? "0",
            order_cancel_policy: restaurant.order_cancel_policy ?? "flexible",
            order_cancel_notice_minutes: restaurant.order_cancel_notice_minutes?.toString() ?? "30",
            order_cancellation_fee_amount: restaurant.order_cancellation_fee_amount?.toString() ?? "0",
        });
    }, [restaurant]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await updateRestaurant({
            has_dine_in: form.has_dine_in,
            has_reservations: form.has_reservations,
            corkage_fee_amount: Number(form.corkage_fee_amount) || 0,
            dine_in_service_fee: Number(form.dine_in_service_fee) || 0,
            reservation_cancel_policy: form.reservation_cancel_policy,
            reservation_cancel_notice_minutes: Number(form.reservation_cancel_notice_minutes) || 0,
            reservation_cancellation_fee_amount: Number(form.reservation_cancellation_fee_amount) || 0,
            order_cancel_policy: form.order_cancel_policy,
            order_cancel_notice_minutes: Number(form.order_cancel_notice_minutes) || 0,
            order_cancellation_fee_amount: Number(form.order_cancellation_fee_amount) || 0,
        });
        if (error) {
            toast.error(`${t.dineIn.error}: ${error}`);
        } else {
            toast.success(t.dineIn.saved);
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Main toggles */}
            <Card>
                <h3 className="font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                    <Armchair size={18} className="text-brand-500" />
                    {t.dineIn.title}
                </h3>
                <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">{t.dineIn.subtitle}</p>

                <div className="space-y-5">
                    <Toggle
                        checked={form.has_dine_in}
                        onChange={(v) => setForm((f) => ({ ...f, has_dine_in: v }))}
                        label={t.dineIn.enabled}
                        description={t.dineIn.enabledDesc}
                    />
                    <Toggle
                        checked={form.has_reservations}
                        onChange={(v) => setForm((f) => ({ ...f, has_reservations: v }))}
                        label={t.dineIn.reservationsEnabled}
                        description={t.dineIn.reservationsEnabledDesc}
                        disabled={!form.has_dine_in}
                    />
                </div>
            </Card>

            {/* Fees */}
            {form.has_dine_in && (
                <Card>
                    <h3 className="font-semibold text-surface-900 dark:text-white mb-4">
                        {t.settings.pricing}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Input
                                label={t.dineIn.corkageFee}
                                type="number"
                                min="0"
                                step="100"
                                value={form.corkage_fee_amount}
                                onChange={(e) => setForm((f) => ({ ...f, corkage_fee_amount: e.target.value }))}
                                hint={t.dineIn.corkageFeeDesc}
                            />
                        </div>
                        <div>
                            <Input
                                label={t.dineIn.serviceFeePercent}
                                type="number"
                                min="0"
                                max="30"
                                step="1"
                                value={form.dine_in_service_fee}
                                onChange={(e) => setForm((f) => ({ ...f, dine_in_service_fee: e.target.value }))}
                                hint={t.dineIn.serviceFeeDesc}
                            />
                        </div>
                    </div>
                </Card>
            )}

            {form.has_dine_in && form.has_reservations && (
                <Card>
                    <h3 className="font-semibold text-surface-900 dark:text-white mb-4">
                        {t.dineIn.cancellationPolicyTitle}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Select
                            label={t.dineIn.cancellationPolicy}
                            value={form.reservation_cancel_policy}
                            onChange={(e) => setForm((f) => ({ ...f, reservation_cancel_policy: e.target.value as "flexible" | "moderate" | "strict" }))}
                            options={[
                                { value: "flexible", label: t.dineIn.cancellationFlexible },
                                { value: "moderate", label: t.dineIn.cancellationModerate },
                                { value: "strict", label: t.dineIn.cancellationStrict },
                            ]}
                        />
                        <Input
                            label={t.dineIn.cancellationNoticeMinutes}
                            type="number"
                            min="0"
                            step="15"
                            value={form.reservation_cancel_notice_minutes}
                            onChange={(e) => setForm((f) => ({ ...f, reservation_cancel_notice_minutes: e.target.value }))}
                            hint={t.dineIn.cancellationNoticeDesc}
                        />
                        <Input
                            label={t.dineIn.cancellationFee}
                            type="number"
                            min="0"
                            step="100"
                            value={form.reservation_cancellation_fee_amount}
                            onChange={(e) => setForm((f) => ({ ...f, reservation_cancellation_fee_amount: e.target.value }))}
                            hint={t.dineIn.cancellationFeeDesc}
                        />
                    </div>
                </Card>
            )}

            <Card>
                <h3 className="font-semibold text-surface-900 dark:text-white mb-4">
                    {t.dineIn.orderCancellationPolicyTitle}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select
                        label={t.dineIn.orderCancellationPolicy}
                        value={form.order_cancel_policy}
                        onChange={(e) => setForm((f) => ({ ...f, order_cancel_policy: e.target.value as "flexible" | "moderate" | "strict" }))}
                        options={[
                            { value: "flexible", label: t.dineIn.cancellationFlexible },
                            { value: "moderate", label: t.dineIn.cancellationModerate },
                            { value: "strict", label: t.dineIn.cancellationStrict },
                        ]}
                    />
                    <Input
                        label={t.dineIn.orderCancellationNoticeMinutes}
                        type="number"
                        min="0"
                        step="5"
                        value={form.order_cancel_notice_minutes}
                        onChange={(e) => setForm((f) => ({ ...f, order_cancel_notice_minutes: e.target.value }))}
                        hint={t.dineIn.orderCancellationNoticeDesc}
                    />
                    <Input
                        label={t.dineIn.orderCancellationFee}
                        type="number"
                        min="0"
                        step="100"
                        value={form.order_cancellation_fee_amount}
                        onChange={(e) => setForm((f) => ({ ...f, order_cancellation_fee_amount: e.target.value }))}
                        hint={t.dineIn.orderCancellationFeeDesc}
                    />
                </div>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" variant="primary" disabled={loading} isLoading={loading}>
                    {t.common.save}
                </Button>
            </div>
        </form>
    );
}
