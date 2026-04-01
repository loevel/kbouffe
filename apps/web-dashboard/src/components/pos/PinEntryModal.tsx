"use client";

import { useCallback, useEffect, useState } from "react";
import { Delete, Check } from "lucide-react";
import { authFetch } from "@kbouffe/module-core/ui";
import { usePosOperator, type PosOperator } from "@/contexts/PosOperatorContext";

// ── Types ────────────────────────────────────────────────────────────────────

interface VerifyPinResponse {
    success: boolean;
    member?: {
        id: string;
        name: string;
        role: string;
    };
    error?: string;
}

// ── Numeric keypad layout ────────────────────────────────────────────────────

const KEYPAD_KEYS = [
    "1", "2", "3",
    "4", "5", "6",
    "7", "8", "9",
    "del", "0", "ok",
] as const;

type KeypadKey = (typeof KEYPAD_KEYS)[number];

// ── Component ────────────────────────────────────────────────────────────────

export function PinEntryModal() {
    const { showPinEntry, closePinEntry, setOperator } = usePosOperator();

    const [digits, setDigits] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [shake, setShake] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Reset state when modal opens
    useEffect(() => {
        if (showPinEntry) {
            setDigits([]);
            setLoading(false);
            setShake(false);
            setErrorMessage(null);
        }
    }, [showPinEntry]);

    const triggerShake = useCallback(() => {
        setShake(true);
        setTimeout(() => {
            setShake(false);
            setDigits([]);
        }, 600);
    }, []);

    const handleVerify = useCallback(async (pin: string) => {
        setLoading(true);
        setErrorMessage(null);

        try {
            const res = await authFetch("/api/team/verify-pin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pin }),
            });

            const data = await res.json() as VerifyPinResponse;

            if (res.ok && data.success && data.member) {
                const op: PosOperator = {
                    memberId: data.member.id,
                    name: data.member.name,
                    role: data.member.role,
                };
                setOperator(op);
                closePinEntry();
            } else {
                setErrorMessage(data.error ?? "PIN incorrect. Réessayez.");
                triggerShake();
            }
        } catch {
            setErrorMessage("Erreur réseau. Réessayez.");
            triggerShake();
        } finally {
            setLoading(false);
        }
    }, [closePinEntry, setOperator, triggerShake]);

    // Auto-submit when 4 digits entered
    useEffect(() => {
        if (digits.length === 4 && !loading) {
            handleVerify(digits.join(""));
        }
    }, [digits, loading, handleVerify]);

    const handleKey = useCallback((key: KeypadKey) => {
        if (loading) return;

        if (key === "del") {
            setDigits((prev) => prev.slice(0, -1));
            setErrorMessage(null);
            return;
        }

        if (key === "ok") {
            if (digits.length === 4) {
                handleVerify(digits.join(""));
            }
            return;
        }

        // Digit key
        if (digits.length < 4) {
            setDigits((prev) => [...prev, key]);
        }
    }, [digits, loading, handleVerify]);

    // Keyboard support
    useEffect(() => {
        if (!showPinEntry) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key >= "0" && e.key <= "9") {
                handleKey(e.key as KeypadKey);
            } else if (e.key === "Backspace") {
                handleKey("del");
            } else if (e.key === "Enter") {
                handleKey("ok");
            } else if (e.key === "Escape") {
                closePinEntry();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [showPinEntry, handleKey, closePinEntry]);

    if (!showPinEntry) return null;

    return (
        /* Full-screen overlay */
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm bg-white dark:bg-surface-900 rounded-3xl shadow-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">

                {/* Header */}
                <div className="px-8 pt-8 pb-4 text-center">
                    <h2 className="text-2xl font-bold text-surface-900 dark:text-white">
                        Qui êtes-vous ?
                    </h2>
                    <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                        Saisissez votre code PIN PDV
                    </p>
                </div>

                {/* PIN dots */}
                <div className="flex items-center justify-center gap-4 px-8 py-4">
                    <div
                        className={`flex gap-4 transition-all ${shake ? "animate-[shake_0.5s_ease-in-out]" : ""}`}
                        style={shake ? { animation: "shake 0.5s ease-in-out" } : undefined}
                    >
                        {[0, 1, 2, 3].map((i) => {
                            const filled = i < digits.length;
                            return (
                                <div
                                    key={i}
                                    className={`w-5 h-5 rounded-full border-2 transition-all duration-150 ${
                                        shake
                                            ? "bg-red-500 border-red-500 scale-110"
                                            : filled
                                            ? "bg-brand-500 border-brand-500 scale-110"
                                            : "bg-transparent border-surface-300 dark:border-surface-600"
                                    }`}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Error message */}
                <div className="min-h-6 px-8 text-center">
                    {errorMessage && (
                        <p className="text-sm text-red-500 font-medium">{errorMessage}</p>
                    )}
                </div>

                {/* Numeric keypad */}
                <div className="grid grid-cols-3 gap-3 px-6 py-4">
                    {KEYPAD_KEYS.map((key) => {
                        const isDelete = key === "del";
                        const isOk = key === "ok";
                        const isDisabled = loading || (isOk && digits.length !== 4);

                        return (
                            <button
                                key={key}
                                onClick={() => handleKey(key)}
                                disabled={isDisabled}
                                aria-label={
                                    isDelete ? "Effacer"
                                    : isOk ? "Valider"
                                    : key
                                }
                                className={`
                                    aspect-square rounded-2xl flex items-center justify-center
                                    text-xl font-semibold transition-all duration-100 select-none
                                    active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed
                                    ${isOk
                                        ? "bg-brand-500 text-white hover:bg-brand-600 shadow-md shadow-brand-500/30"
                                        : isDelete
                                        ? "bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700"
                                        : "bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white hover:bg-surface-200 dark:hover:bg-surface-700 shadow-sm"
                                    }
                                `}
                            >
                                {isDelete ? (
                                    <Delete size={20} />
                                ) : isOk ? (
                                    loading ? (
                                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Check size={22} />
                                    )
                                ) : (
                                    key
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Cancel */}
                <div className="px-6 pb-6 text-center">
                    <button
                        onClick={closePinEntry}
                        disabled={loading}
                        className="text-sm text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors disabled:opacity-40"
                    >
                        Annuler
                    </button>
                </div>
            </div>

            {/* Shake keyframe — injected inline since Tailwind 4 doesn't bundle it by default */}
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    20%       { transform: translateX(-8px); }
                    40%       { transform: translateX(8px); }
                    60%       { transform: translateX(-6px); }
                    80%       { transform: translateX(6px); }
                }
            `}</style>
        </div>
    );
}
