/**
 * RefundModal — Modal de confirmation de remboursement d'une commande
 *
 * Usage :
 *   <RefundModal
 *     open={showRefund}
 *     onClose={() => setShowRefund(false)}
 *     order={{ id, total, payment_method, payment_status }}
 *     onSuccess={(result) => { mutate(); }}
 *   />
 */
"use client";

import { useState } from "react";
import { RotateCcw, AlertTriangle } from "lucide-react";
import {
    Modal,
    ModalFooter,
    Button,
    Textarea,
    toast,
    formatCFA,
    formatOrderId,
    getPaymentLabel,
    authFetch,
} from "@kbouffe/module-core/ui";

// ── Types ─────────────────────────────────────────────────────────────────

export interface RefundResult {
    success: boolean;
    method?: string;
    referenceId?: string;
    warning?: string;
}

export interface RefundModalProps {
    open: boolean;
    onClose: () => void;
    order: {
        id: string;
        total: number;
        payment_method: string;
        payment_status: string;
    };
    onSuccess: (result: RefundResult) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────

const MOBILE_MONEY_METHODS = new Set([
    "mtn_mobile_money",
    "mobile_money_mtn",
    "orange_money",
    "mobile_money_orange",
]);

function isMobileMoney(method: string): boolean {
    return MOBILE_MONEY_METHODS.has(method);
}

function getRefundMethodMessage(method: string): string {
    if (method === "cash") {
        return "Le remboursement doit être effectué manuellement en espèces, hors plateforme.";
    }
    if (isMobileMoney(method)) {
        return `Remboursement automatique sur le numéro ${getPaymentLabel(method)} enregistré lors de la commande.`;
    }
    return "Le remboursement sera traité selon le mode de paiement utilisé.";
}

function getApiErrorMessage(status: number, serverMessage?: string): string {
    if (status === 502 || status === 503) {
        return "Le remboursement mobile a échoué (erreur réseau MTN/Orange). Veuillez effectuer le remboursement manuellement et contacter le support si nécessaire.";
    }
    if (status === 400) {
        return serverMessage ?? "Cette commande ne peut pas être remboursée (statut invalide).";
    }
    if (status === 403) {
        return "Vous n'avez pas les droits pour effectuer cette action.";
    }
    if (status === 404) {
        return "Commande introuvable.";
    }
    return serverMessage ?? "Une erreur inattendue est survenue. Veuillez réessayer.";
}

// ── Component ─────────────────────────────────────────────────────────────

export function RefundModal({ open, onClose, order, onSuccess }: RefundModalProps) {
    const [reason, setReason] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isCash = order.payment_method === "cash";
    const isMomo = isMobileMoney(order.payment_method);
    const methodMessage = getRefundMethodMessage(order.payment_method);

    // ── Handlers ──────────────────────────────────────────────────────────

    const handleConfirm = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const body = reason.trim() ? { reason: reason.trim() } : {};

            const res = await authFetch(`/api/orders/${order.id}/refund`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const json = await res.json().catch(() => ({})) as Record<string, unknown>;

            if (!res.ok) {
                const msg = getApiErrorMessage(res.status, json.error as string | undefined);
                setError(msg);
                return;
            }

            const refundData = json.refund as Record<string, unknown> | undefined;
            const result: RefundResult = {
                success: true,
                method: refundData?.method as string | undefined,
                referenceId: refundData?.referenceId as string | undefined,
                warning: refundData?.warning as string | undefined,
            };

            // Warn merchant if MoMo disbursement returned a warning
            if (result.warning) {
                toast.warning(`Attention : ${result.warning}`);
            } else {
                toast.success("Remboursement effectué avec succès");
            }

            onSuccess(result);
            handleClose();
        } catch {
            setError("Impossible de contacter le serveur. Vérifiez votre connexion et réessayez.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (isLoading) return;
        setError(null);
        setReason("");
        onClose();
    };

    // ── Render ────────────────────────────────────────────────────────────

    return (
        <Modal
            isOpen={open}
            onClose={handleClose}
            title="Rembourser la commande"
            description="Vérifiez les informations avant de confirmer."
            size="md"
        >
            {/* Order summary */}
            <div className="bg-surface-50 dark:bg-surface-800/60 rounded-xl px-4 py-3 mb-5 space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-surface-500 dark:text-surface-400">Commande</span>
                    <span className="text-sm font-semibold font-mono text-surface-900 dark:text-white">
                        {formatOrderId(order.id)}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-surface-500 dark:text-surface-400">Montant</span>
                    <span className="text-sm font-bold text-surface-900 dark:text-white">
                        {formatCFA(order.total)}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-surface-500 dark:text-surface-400">Paiement</span>
                    <span className="text-sm font-medium text-surface-900 dark:text-white">
                        {getPaymentLabel(order.payment_method)}
                    </span>
                </div>
            </div>

            {/* Warning block */}
            <div
                role="alert"
                className="flex items-start gap-3 p-3.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl mb-5"
            >
                <AlertTriangle size={16} className="text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden />
                <div className="space-y-1.5">
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                        Cette action est irréversible.
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                        {methodMessage}
                    </p>
                    {isCash && (
                        <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                            ⚠️ Paiement en espèces — le remboursement doit être effectué
                            manuellement en dehors de la plateforme.
                        </p>
                    )}
                    {isMomo && (
                        <p className="text-xs text-amber-600 dark:text-amber-500">
                            • MTN MoMo : remboursement automatique via Disbursement API
                            <br />
                            • En cas d'échec réseau, un remboursement manuel sera nécessaire.
                        </p>
                    )}
                </div>
            </div>

            {/* Inline API error */}
            {error && (
                <div
                    role="alert"
                    className="flex items-start gap-2.5 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl mb-5"
                >
                    <AlertTriangle size={15} className="text-red-500 dark:text-red-400 shrink-0 mt-0.5" aria-hidden />
                    <p className="text-sm text-red-700 dark:text-red-400 leading-relaxed">{error}</p>
                </div>
            )}

            {/* Optional reason */}
            <Textarea
                label="Raison (optionnel)"
                placeholder="Motif du remboursement — ex : produit non conforme, annulation client…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
            />

            <ModalFooter>
                <Button
                    variant="outline"
                    onClick={handleClose}
                    disabled={isLoading}
                    aria-label="Annuler le remboursement"
                >
                    Annuler
                </Button>
                <Button
                    variant="danger"
                    leftIcon={<RotateCcw size={15} />}
                    isLoading={isLoading}
                    onClick={handleConfirm}
                    aria-label="Confirmer le remboursement"
                >
                    Confirmer le remboursement
                </Button>
            </ModalFooter>
        </Modal>
    );
}
