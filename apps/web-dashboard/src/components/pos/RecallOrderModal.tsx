"use client";

import { useState } from "react";
import { CreditCard, Banknote } from "lucide-react";
import { Modal, ModalFooter, Button, toast } from "@kbouffe/module-core/ui";
import { authFetch } from "@kbouffe/module-core/ui";
import { formatCFA } from "@kbouffe/module-core/ui";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DraftOrder {
    id: string;
    draft_label: string | null;
    customer_name: string;
    table_number: string | null;
    total: number;
    items_count: number;
    created_at: string;
}

interface RecallOrderModalProps {
    order: DraftOrder | null;
    isOpen: boolean;
    onClose: () => void;
    onRecalled: () => void;
}

// ── Payment methods ───────────────────────────────────────────────────────────

const PAYMENT_OPTIONS = [
    {
        value: "cash",
        label: "Espèces",
        description: "Paiement en cash",
        icon: Banknote,
    },
    {
        value: "mtn_momo",
        label: "MTN MoMo",
        description: "Mobile Money MTN",
        icon: CreditCard,
    },
    {
        value: "orange_money",
        label: "Orange Money",
        description: "Mobile Money Orange",
        icon: CreditCard,
    },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────

export function RecallOrderModal({ order, isOpen, onClose, onRecalled }: RecallOrderModalProps) {
    const [paymentMethod, setPaymentMethod] = useState<string>("cash");
    const [loading, setLoading] = useState(false);

    if (!order) return null;

    const handleRecall = async () => {
        setLoading(true);
        try {
            const res = await authFetch(`/api/orders/${order.id}/recall`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentMethod }),
            });

            const data = await res.json() as { success?: boolean; error?: string };

            if (!res.ok) {
                toast.error(data.error ?? "Erreur lors du rappel de la commande");
                return;
            }

            toast.success("Commande rappelée avec succès ✓");
            onRecalled();
            onClose();
        } catch {
            toast.error("Erreur réseau");
        } finally {
            setLoading(false);
        }
    };

    const label = order.draft_label ?? order.customer_name;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Rappeler la commande"
            description={`Finalisez et soumettez la commande garée "${label}"`}
            size="md"
        >
            {/* Order summary */}
            <div className="mb-5 p-4 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-surface-900 dark:text-white">
                        {label}
                    </span>
                    {order.table_number && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 font-medium">
                            Table {order.table_number}
                        </span>
                    )}
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-surface-500">
                        {order.items_count} article{order.items_count !== 1 ? "s" : ""}
                    </span>
                    <span className="font-bold text-surface-900 dark:text-white text-base">
                        {formatCFA(order.total)}
                    </span>
                </div>
            </div>

            {/* Payment method selector */}
            <div className="space-y-2">
                <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    Mode de paiement
                </p>
                <div className="grid grid-cols-1 gap-2">
                    {PAYMENT_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        const isSelected = paymentMethod === option.value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => setPaymentMethod(option.value)}
                                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 text-left transition-all ${
                                    isSelected
                                        ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                                        : "border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600"
                                }`}
                            >
                                <div className={`p-1.5 rounded-lg ${isSelected ? "bg-brand-100 dark:bg-brand-900/40" : "bg-surface-100 dark:bg-surface-700"}`}>
                                    <Icon
                                        size={16}
                                        className={isSelected ? "text-brand-600 dark:text-brand-400" : "text-surface-500"}
                                    />
                                </div>
                                <div>
                                    <p className={`text-sm font-semibold ${isSelected ? "text-brand-700 dark:text-brand-300" : "text-surface-800 dark:text-surface-200"}`}>
                                        {option.label}
                                    </p>
                                    <p className="text-xs text-surface-500">{option.description}</p>
                                </div>
                                <div className="ml-auto">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        isSelected
                                            ? "border-brand-500 bg-brand-500"
                                            : "border-surface-300 dark:border-surface-600"
                                    }`}>
                                        {isSelected && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <ModalFooter>
                <Button variant="outline" onClick={onClose} disabled={loading}>
                    Annuler
                </Button>
                <Button
                    onClick={handleRecall}
                    isLoading={loading}
                    disabled={!paymentMethod}
                >
                    Finaliser la commande
                </Button>
            </ModalFooter>
        </Modal>
    );
}
