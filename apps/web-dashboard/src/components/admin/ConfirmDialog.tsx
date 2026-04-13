"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@kbouffe/module-core/ui";
import { cn } from "@/lib/utils";

export interface ConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    /** Label for the confirm button. Default: "Confirmer" */
    confirmLabel?: string;
    /** "danger" renders the confirm button in red. Default: "default" */
    variant?: "default" | "danger";
    /**
     * If provided, the confirm button is disabled until the user types this
     * exact string in the verification input.
     */
    requireTyping?: string;
}

/**
 * Accessible confirmation dialog with optional type-to-confirm guard.
 * Animated via framer-motion. Closes on Escape key.
 */
export function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = "Confirmer",
    variant = "default",
    requireTyping,
}: ConfirmDialogProps) {
    const [typedValue, setTypedValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const isDanger = variant === "danger";

    // Reset typed value whenever dialog opens/closes
    useEffect(() => {
        if (!open) {
            setTypedValue("");
        } else if (requireTyping && inputRef.current) {
            // Focus input shortly after animation begins
            const id = setTimeout(() => inputRef.current?.focus(), 80);
            return () => clearTimeout(id);
        }
    }, [open, requireTyping]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open, onClose]);

    const isConfirmDisabled = requireTyping
        ? typedValue.trim() !== requireTyping.trim()
        : false;

    const handleConfirm = () => {
        if (isConfirmDisabled) return;
        onConfirm();
    };

    return (
        <AnimatePresence>
            {open && (
                <div
                    className="fixed inset-0 z-[999] flex items-center justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="confirm-dialog-title"
                    aria-describedby="confirm-dialog-description"
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        onClick={onClose}
                        aria-hidden="true"
                    />

                    {/* Dialog panel */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.93, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.93, y: 10 }}
                        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                        className="relative bg-white dark:bg-surface-900 rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-800 max-w-md w-full overflow-hidden"
                    >
                        {/* Top accent bar for danger variant */}
                        {isDanger && (
                            <div className="h-1 bg-gradient-to-r from-red-500 to-red-400" />
                        )}

                        <div className="p-6 space-y-5">
                            {/* Close button */}
                            <button
                                type="button"
                                onClick={onClose}
                                className="absolute top-4 right-4 p-1.5 rounded-lg text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                                aria-label="Fermer"
                            >
                                <X size={18} />
                            </button>

                            {/* Icon + Title */}
                            <div className="flex items-start gap-4 pr-8">
                                <div
                                    className={cn(
                                        "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                                        isDanger
                                            ? "bg-red-500/10 text-red-500"
                                            : "bg-brand-500/10 text-brand-500"
                                    )}
                                >
                                    <AlertTriangle size={22} />
                                </div>
                                <div>
                                    <h3
                                        id="confirm-dialog-title"
                                        className="text-base font-bold text-surface-900 dark:text-white leading-tight"
                                    >
                                        {title}
                                    </h3>
                                    <p
                                        id="confirm-dialog-description"
                                        className="text-sm text-surface-500 dark:text-surface-400 mt-1.5 leading-relaxed"
                                    >
                                        {description}
                                    </p>
                                </div>
                            </div>

                            {/* Type-to-confirm input */}
                            {requireTyping && (
                                <div className="space-y-2 pt-1">
                                    <p className="text-sm text-surface-600 dark:text-surface-400">
                                        Tapez{" "}
                                        <strong className="font-mono text-surface-900 dark:text-white bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded text-xs">
                                            {requireTyping}
                                        </strong>{" "}
                                        pour confirmer
                                    </p>
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={typedValue}
                                        onChange={(e) => setTypedValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !isConfirmDisabled) handleConfirm();
                                        }}
                                        placeholder={requireTyping}
                                        autoComplete="off"
                                        spellCheck={false}
                                        className={cn(
                                            "w-full px-3 py-2.5 text-sm rounded-xl border bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-white font-mono",
                                            "placeholder:text-surface-300 dark:placeholder:text-surface-600",
                                            "focus:outline-none focus:ring-2 transition-colors",
                                            typedValue && !isConfirmDisabled
                                                ? "border-green-400 dark:border-green-500 focus:ring-green-400/30"
                                                : isDanger
                                                ? "border-red-300 dark:border-red-800 focus:ring-red-400/30"
                                                : "border-surface-200 dark:border-surface-700 focus:ring-brand-500/30"
                                        )}
                                        aria-label={`Tapez ${requireTyping} pour confirmer`}
                                    />
                                    {typedValue && isConfirmDisabled && (
                                        <p className="text-xs text-red-500">
                                            Le texte ne correspond pas.
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex justify-end gap-3 pt-1">
                                <Button variant="outline" onClick={onClose} type="button">
                                    Annuler
                                </Button>
                                <button
                                    type="button"
                                    onClick={handleConfirm}
                                    disabled={isConfirmDisabled}
                                    className={cn(
                                        "inline-flex items-center justify-center font-semibold text-sm px-4 py-2.5 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-surface-900",
                                        "disabled:opacity-40 disabled:cursor-not-allowed",
                                        isDanger
                                            ? "bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/20 focus:ring-red-500"
                                            : "bg-brand-500 hover:bg-brand-600 text-white shadow-md shadow-brand-500/20 focus:ring-brand-500"
                                    )}
                                >
                                    {confirmLabel}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
