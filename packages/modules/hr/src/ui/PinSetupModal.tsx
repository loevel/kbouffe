"use client";

import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { Modal, ModalFooter, Button, toast, authFetch } from "@kbouffe/module-core/ui";

interface PinSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
    memberId: string;
    memberName: string;
    hasPin: boolean;
    onSuccess?: () => void;
}

export function PinSetupModal({
    isOpen,
    onClose,
    memberId,
    memberName,
    hasPin,
    onSuccess,
}: PinSetupModalProps) {
    const [pin, setPin] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const title = hasPin
        ? `Modifier le PIN — ${memberName}`
        : `Définir le PIN — ${memberName}`;

    const handlePinChange = (value: string) => {
        // Only allow digits, max 4 characters
        const cleaned = value.replace(/\D/g, "").slice(0, 4);
        setPin(cleaned);
        if (error) setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!/^\d{4}$/.test(pin)) {
            setError("Le PIN doit être composé exactement de 4 chiffres.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await authFetch(`/api/team/${memberId}/pin`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pin }),
            });

            const data = await res.json() as { success?: boolean; error?: string };

            if (!res.ok || !data.success) {
                setError(data.error ?? "Erreur lors de la définition du PIN.");
                return;
            }

            toast.success(`PIN défini pour ${memberName}`);
            setPin("");
            onSuccess?.();
            onClose();
        } catch {
            setError("Erreur réseau. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setPin("");
        setError(null);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={title}
            description={
                hasPin
                    ? "Saisissez un nouveau PIN à 4 chiffres pour remplacer l'actuel."
                    : "Ce PIN permettra à ce membre de s'identifier sur les tablettes PDV."
            }
            size="sm"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* PIN dots preview */}
                <div className="flex items-center justify-center gap-3 py-2">
                    {[0, 1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className={`w-4 h-4 rounded-full border-2 transition-all ${
                                i < pin.length
                                    ? "bg-brand-500 border-brand-500"
                                    : "bg-transparent border-surface-300 dark:border-surface-600"
                            }`}
                        />
                    ))}
                </div>

                {/* PIN input */}
                <div>
                    <label
                        htmlFor="pin-input"
                        className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5"
                    >
                        Code PIN (4 chiffres)
                    </label>
                    <input
                        id="pin-input"
                        type="tel"
                        inputMode="numeric"
                        pattern="\d{4}"
                        maxLength={4}
                        value={pin}
                        onChange={(e) => handlePinChange(e.target.value)}
                        placeholder="••••"
                        autoFocus
                        autoComplete="off"
                        className={`w-full px-4 py-2.5 rounded-xl border text-center text-2xl tracking-[0.5em] font-mono
                            bg-white dark:bg-surface-800
                            text-surface-900 dark:text-white
                            placeholder:text-surface-300 dark:placeholder:text-surface-600
                            outline-none transition-all
                            ${error
                                ? "border-red-400 focus:ring-2 focus:ring-red-300"
                                : "border-surface-200 dark:border-surface-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900"
                            }`}
                    />
                    {error && (
                        <p className="mt-1.5 text-sm text-red-500">{error}</p>
                    )}
                </div>

                <ModalFooter className="pt-2">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        Annuler
                    </Button>
                    <Button
                        type="submit"
                        disabled={pin.length !== 4 || loading}
                        leftIcon={loading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                    >
                        {loading ? "Enregistrement…" : hasPin ? "Modifier le PIN" : "Définir le PIN"}
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
}
