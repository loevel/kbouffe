"use client";

import { useState } from "react";
import { Check, ChefHat, Package, CircleCheck, XCircle } from "lucide-react";
import { Button, Input, Modal, ModalFooter, Textarea, toast, useLocale, type OrderStatus } from "@kbouffe/module-core/ui";
import { updateOrderStatus, refundOrder } from "../hooks/use-orders";

interface OrderActionsProps {
    orderId: string;
    status: OrderStatus;
    onStatusChange: (status: OrderStatus) => void;
}

export function OrderActions({ orderId, status, onStatusChange }: OrderActionsProps) {
    const { t } = useLocale();
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showAcceptModal, setShowAcceptModal] = useState(false);
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [preparationTime, setPreparationTime] = useState("25");
    const [prepTimeError, setPrepTimeError] = useState<string>("");
    const [updating, setUpdating] = useState(false);

    // Validate preparation time value
    const validatePrepTime = (value: string): string => {
        const parsedMinutes = Number(value);

        if (!value.trim()) {
            return t.orders.preparationTimeRequired || "La durée est requise";
        }

        if (!Number.isFinite(parsedMinutes)) {
            return "Veuillez entrer un nombre valide";
        }

        if (!Number.isInteger(parsedMinutes)) {
            return "Veuillez entrer un nombre entier";
        }

        if (parsedMinutes <= 0) {
            return "La durée doit être au moins 1 minute";
        }

        if (parsedMinutes > 600) {
            return "La durée maximum est 600 minutes";
        }

        return "";
    };

    const nextActions: Partial<Record<OrderStatus, { label: string; next: OrderStatus; icon: React.ReactNode; variant: "primary" | "secondary" }>> = {
        pending: { label: t.orders.acceptOrder, next: "accepted", icon: <Check size={18} />, variant: "primary" },
        accepted: { label: t.orders.startPreparation, next: "preparing", icon: <ChefHat size={18} />, variant: "primary" },
        preparing: { label: t.orders.markReady, next: "ready", icon: <Package size={18} />, variant: "primary" },
        ready: { label: t.orders.completeOrder, next: "completed", icon: <CircleCheck size={18} />, variant: "primary" },
    };
    const action = nextActions[status];

    const handleCancel = async () => {
        setUpdating(true);
        const { success, error } = await updateOrderStatus(orderId, "cancelled", cancelReason);
        setUpdating(false);
        if (!success) { toast.error(error ?? "Erreur"); return; }
        onStatusChange("cancelled");
        toast.success(t.orders.orderCancelled);
        setShowCancelModal(false);
        setCancelReason("");
    };

    const handleAccept = async () => {
        // Validate before sending
        const error = validatePrepTime(preparationTime);
        if (error) {
            setPrepTimeError(error);
            toast.error(error);
            return;
        }

        const parsedMinutes = Number(preparationTime);
        setUpdating(true);
        const { success, error: apiError } = await updateOrderStatus(orderId, "accepted", undefined, parsedMinutes);
        setUpdating(false);

        if (!success) {
            toast.error(apiError ?? "Erreur lors de l'acceptation de la commande");
            return;
        }

        onStatusChange("accepted");
        toast.success(t.orders.orderAccepted);
        setShowAcceptModal(false);
        setPreparationTime("25");
        setPrepTimeError("");
    };

    const handleRefund = async () => {
        setUpdating(true);
        const { success, error } = await refundOrder(orderId);
        setUpdating(false);
        if (!success) { toast.error(error ?? "Erreur"); return; }
        onStatusChange("refunded");
        toast.success(t.orders.orderRefunded);
        setShowRefundModal(false);
    };

    if (status === "cancelled" || status === "refunded") return null;

    return (
        <>
            <div className="flex items-center gap-3">
                {action && (
                    <Button
                        variant={action.variant}
                        leftIcon={action.icon}
                        isLoading={updating}
                        onClick={async () => {
                            if (action.next === "accepted") {
                                setShowAcceptModal(true);
                                return;
                            }
                            setUpdating(true);
                            const { success, error } = await updateOrderStatus(orderId, action.next);
                            setUpdating(false);
                            if (!success) { toast.error(error ?? "Erreur"); return; }
                            onStatusChange(action.next);
                            toast.success(
                                action.next === "preparing" ? t.orders.orderPreparing :
                                action.next === "ready" ? t.orders.orderReady :
                                t.orders.orderCompleted
                            );
                        }}
                    >
                        {action.label}
                    </Button>
                )}
                <Button
                    variant="outline"
                    leftIcon={<XCircle size={18} />}
                    onClick={() => setShowCancelModal(true)}
                    className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                >
                    {t.orders.cancelOrder}
                </Button>

                {status === "completed" && (
                    <Button
                        variant="outline"
                        leftIcon={<XCircle size={18} />}
                        onClick={() => setShowRefundModal(true)}
                        className="text-orange-600 border-orange-200 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-800 dark:hover:bg-orange-900/20"
                    >
                        {t.orders.refundOrder}
                    </Button>
                )}
            </div>

            <Modal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                title={t.orders.cancelOrderTitle}
                description={t.orders.cancelIrreversible}
            >
                <Textarea
                    label={t.orders.cancelReason}
                    placeholder={t.orders.cancelReasonPlaceholder}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={3}
                />
                <ModalFooter>
                    <Button variant="outline" onClick={() => setShowCancelModal(false)}>
                        {t.common.back}
                    </Button>
                    <Button variant="danger" onClick={handleCancel}>
                        {t.orders.confirmCancel}
                    </Button>
                </ModalFooter>
            </Modal>

            <Modal
                isOpen={showAcceptModal}
                onClose={() => {
                    setShowAcceptModal(false);
                    setPrepTimeError("");
                }}
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
                    value={preparationTime}
                    onChange={(e) => {
                        const newValue = e.target.value;
                        setPreparationTime(newValue);
                        // Real-time validation
                        const validationError = validatePrepTime(newValue);
                        setPrepTimeError(validationError);
                    }}
                    placeholder={t.orders.preparationTimePlaceholder}
                    hint={!prepTimeError ? t.orders.preparationTimeHint : undefined}
                    error={prepTimeError || undefined}
                    autoFocus
                />
                <ModalFooter>
                    <Button variant="outline" onClick={() => {
                        setShowAcceptModal(false);
                        setPrepTimeError("");
                    }}>
                        {t.common.back}
                    </Button>
                    <Button
                        variant="primary"
                        isLoading={updating}
                        onClick={handleAccept}
                        disabled={!!prepTimeError || updating}
                    >
                        {t.orders.confirmAcceptWithPrep}
                    </Button>
                </ModalFooter>
            </Modal>

            <Modal
                isOpen={showRefundModal}
                onClose={() => setShowRefundModal(false)}
                title={t.orders.refundOrderTitle}
                description={t.orders.refundIrreversible}
            >
                <ModalFooter>
                    <Button variant="outline" onClick={() => setShowRefundModal(false)}>
                        {t.common.back}
                    </Button>
                    <Button variant="danger" isLoading={updating} onClick={handleRefund}>
                        {t.orders.confirmRefund}
                    </Button>
                </ModalFooter>
            </Modal>
        </>
    );
}
