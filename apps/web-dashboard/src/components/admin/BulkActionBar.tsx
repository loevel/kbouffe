"use client";

import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface BulkAction {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: "default" | "danger";
    disabled?: boolean;
}

interface BulkActionBarProps {
    selectedCount: number;
    onClearSelection: () => void;
    actions: BulkAction[];
}

export function BulkActionBar({ selectedCount, onClearSelection, actions }: BulkActionBarProps) {
    return (
        <AnimatePresence>
            {selectedCount > 0 && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", damping: 22, stiffness: 320 }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-surface-900 dark:bg-white text-white dark:text-surface-900 px-5 py-3 rounded-2xl shadow-2xl shadow-black/30 border border-white/10 dark:border-surface-200 min-w-max"
                >
                    <span className="text-sm font-black pr-3 border-r border-white/20 dark:border-surface-300 whitespace-nowrap uppercase tracking-widest">
                        {selectedCount} élément{selectedCount > 1 ? "s" : ""} sélectionné{selectedCount > 1 ? "s" : ""}
                    </span>

                    {actions.map((action, i) => (
                        <button
                            key={i}
                            onClick={action.onClick}
                            disabled={action.disabled}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95",
                                action.variant === "danger"
                                    ? "bg-red-500 hover:bg-red-600 text-white shadow-sm shadow-red-500/30"
                                    : "bg-white/10 dark:bg-surface-100 hover:bg-white/20 dark:hover:bg-surface-200 text-white dark:text-surface-900"
                            )}
                        >
                            {action.icon}
                            {action.label}
                        </button>
                    ))}

                    <button
                        onClick={onClearSelection}
                        className="ml-1 w-8 h-8 rounded-xl bg-white/10 dark:bg-surface-100 hover:bg-white/20 dark:hover:bg-surface-200 flex items-center justify-center transition-all text-white dark:text-surface-900 active:scale-95"
                        title="Annuler la sélection"
                    >
                        <X size={16} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
