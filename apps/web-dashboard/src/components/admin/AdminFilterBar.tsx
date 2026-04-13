"use client";

import { X } from "lucide-react";

interface AdminFilterBarProps {
    children: React.ReactNode;
    onReset?: () => void;
    activeFilterCount?: number;
}

export function AdminFilterBar({ children, onReset, activeFilterCount = 0 }: AdminFilterBarProps) {
    const isActive = activeFilterCount > 0;

    return (
        <div className="flex flex-wrap items-end gap-4 bg-white dark:bg-surface-900 p-4 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm">
            {children}
            {onReset && isActive && (
                <div className="flex items-center gap-2 ml-auto self-end pb-0.5">
                    <span className="flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-brand-500 text-white text-[9px] font-black tabular-nums">
                        {activeFilterCount}
                    </span>
                    <button
                        type="button"
                        onClick={onReset}
                        className="flex items-center gap-1.5 text-[10px] font-black text-surface-400 hover:text-rose-500 transition-colors uppercase tracking-widest"
                    >
                        <X size={12} />
                        Réinitialiser
                    </button>
                </div>
            )}
        </div>
    );
}
