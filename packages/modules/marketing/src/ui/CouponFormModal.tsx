"use client";

import { useEffect, useState } from "react";
import { Modal, ModalFooter, Button, Input, Select, Toggle } from "@/components/ui";
import { useCoupons } from "@/hooks/use-data";
import { useLocale } from "@/contexts/locale-context";
import { toast } from "@/components/ui";
import type { Coupon, CouponAppliesTo, CouponType } from "@/lib/supabase/types";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    coupon?: Coupon | null;
}

interface FormState {
    code: string;
    name: string;
    description: string;
    type: CouponType;
    value: string;
    min_order: string;
    max_discount: string;
    max_uses: string;
    max_uses_per_customer: string;
    is_active: boolean;
    starts_at: string;
    expires_at: string;
    applies_to: CouponAppliesTo;
}

const defaultForm: FormState = {
    code: "",
    name: "",
    description: "",
    type: "percent",
    value: "",
    min_order: "0",
    max_discount: "",
    max_uses: "",
    max_uses_per_customer: "1",
    is_active: true,
    starts_at: "",
    expires_at: "",
    applies_to: "all",
};

export function CouponFormModal({ isOpen, onClose, coupon }: Props) {
    const { t } = useLocale();
    const { createCoupon, updateCoupon } = useCoupons();
    const [form, setForm] = useState<FormState>(defaultForm);
    const [errors, setErrors] = useState<Partial<FormState>>({});
    const [saving, setSaving] = useState(false);

    const isEditing = Boolean(coupon);

    useEffect(() => {
        if (coupon) {
            setForm({
                code: coupon.code,
                name: coupon.name,
                description: coupon.description ?? "",
                type: coupon.type,
                value: String(coupon.value),
                min_order: String(coupon.min_order ?? 0),
                max_discount: coupon.max_discount != null ? String(coupon.max_discount) : "",
                max_uses: coupon.max_uses != null ? String(coupon.max_uses) : "",
                max_uses_per_customer: String(coupon.max_uses_per_customer ?? 1),
                is_active: coupon.is_active,
                starts_at: coupon.starts_at ? coupon.starts_at.slice(0, 10) : "",
                expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 10) : "",
                applies_to: coupon.applies_to,
            });
        } else {
            setForm(defaultForm);
        }
        setErrors({});
    }, [coupon, isOpen]);

    function set(field: keyof FormState, value: string | boolean) {
        setForm((f) => ({ ...f, [field]: value }));
        setErrors((e) => ({ ...e, [field]: undefined }));
    }

    function validate(): boolean {
        const newErrors: Partial<FormState> = {};
        if (!form.code.trim()) newErrors.code = "Requis";
        if (!form.name.trim()) newErrors.name = "Requis";
        const v = parseFloat(form.value);
        if (!form.value || isNaN(v) || v <= 0) newErrors.value = "Valeur positive requise";
        if (form.type === "percent" && v > 100) newErrors.value = "Maximum 100%";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    async function handleSubmit() {
        if (!validate()) return;
        setSaving(true);
        try {
            const payload = {
                code: form.code.toUpperCase().trim(),
                name: form.name.trim(),
                description: form.description.trim() || null,
                type: form.type,
                value: parseFloat(form.value),
                min_order: parseInt(form.min_order || "0"),
                max_discount: form.max_discount ? parseInt(form.max_discount) : null,
                max_uses: form.max_uses ? parseInt(form.max_uses) : null,
                max_uses_per_customer: parseInt(form.max_uses_per_customer || "1"),
                is_active: form.is_active,
                starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
                expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
                applies_to: form.applies_to,
            };

            if (isEditing && coupon) {
                await updateCoupon(coupon.id, payload);
                toast.success(t.coupons.updated);
            } else {
                await createCoupon(payload);
                toast.success(t.coupons.created);
            }
            onClose();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erreur");
        } finally {
            setSaving(false);
        }
    }

    const typeOptions = [
        { value: "percent", label: t.coupons.typePercent },
        { value: "fixed", label: t.coupons.typeFixed },
    ];

    const appliesToOptions = [
        { value: "all", label: t.coupons.appliesToAll },
        { value: "delivery", label: t.coupons.appliesToDelivery },
        { value: "pickup", label: t.coupons.appliesToPickup },
        { value: "dine_in", label: t.coupons.appliesToDineIn },
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? `${t.coupons.code} — ${coupon?.code}` : t.coupons.new}
            size="lg"
        >
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label={t.coupons.code}
                        value={form.code}
                        onChange={(e: any) => set("code", e.target.value.toUpperCase())}
                        error={errors.code}
                        placeholder="EX: WELCOME10"
                        className="font-mono uppercase"
                        disabled={isEditing}
                    />
                    <Input
                        label={t.coupons.name}
                        value={form.name}
                        onChange={(e: any) => set("name", e.target.value)}
                        error={errors.name}
                        placeholder="Bienvenue -10%"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label={t.coupons.type}
                        value={form.type}
                        onChange={(e: any) => set("type", e.target.value)}
                        options={typeOptions}
                    />
                    <Input
                        label={`${t.coupons.value} (${form.type === "percent" ? "%" : "FCFA"})`}
                        type="number"
                        min={1}
                        max={form.type === "percent" ? 100 : undefined}
                        value={form.value}
                        onChange={(e: any) => set("value", e.target.value)}
                        error={errors.value}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label={t.coupons.minOrder}
                        type="number"
                        min={0}
                        value={form.min_order}
                        onChange={(e: any) => set("min_order", e.target.value)}
                        hint={t.common.optional + " — 0 = pas de minimum"}
                    />
                    {form.type === "percent" && (
                        <Input
                            label={t.coupons.maxDiscount}
                            type="number"
                            min={0}
                            value={form.max_discount}
                            onChange={(e: any) => set("max_discount", e.target.value)}
                            hint={t.common.optional + " — plafond en FCFA"}
                        />
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label={t.coupons.maxUses}
                        type="number"
                        min={1}
                        value={form.max_uses}
                        onChange={(e: any) => set("max_uses", e.target.value)}
                        hint={t.coupons.unlimited + " si vide"}
                    />
                    <Input
                        label={t.coupons.maxUsesPerCustomer}
                        type="number"
                        min={1}
                        value={form.max_uses_per_customer}
                        onChange={(e: any) => set("max_uses_per_customer", e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label={t.coupons.startsAt}
                        type="date"
                        value={form.starts_at}
                        onChange={(e: any) => set("starts_at", e.target.value)}
                        hint={t.common.optional}
                    />
                    <Input
                        label={t.coupons.expiresAt}
                        type="date"
                        value={form.expires_at}
                        onChange={(e: any) => set("expires_at", e.target.value)}
                        hint={t.common.optional}
                    />
                </div>

                <Select
                    label={t.coupons.appliesTo}
                    value={form.applies_to}
                    onChange={(e: any) => set("applies_to", e.target.value)}
                    options={appliesToOptions}
                />

                <Toggle
                    label={t.coupons.isActive}
                    checked={form.is_active}
                    onChange={(v: any) => set("is_active", v)}
                />
            </div>

            <ModalFooter>
                <Button variant="ghost" onClick={onClose} disabled={saving}>
                    {t.common.cancel}
                </Button>
                <Button onClick={handleSubmit} isLoading={saving}>
                    {isEditing ? t.common.save : t.coupons.new}
                </Button>
            </ModalFooter>
        </Modal>
    );
}
