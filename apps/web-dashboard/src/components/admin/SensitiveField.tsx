"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdmin } from "@/components/providers/AdminProvider";
import type { AdminRole } from "@/lib/admin-permissions";

interface SensitiveFieldProps {
    value: string;
    revealValue?: string | null;
    /** Admin roles that can reveal the full value. Defaults to ["super_admin"] */
    visibleTo?: AdminRole[];
    className?: string;
}

/**
 * Displays a sensitive value (e.g. phone number, reference) with masking.
 * - Unauthorized roles: always masked, no toggle.
 * - Authorized roles: masked by default with an eye-icon toggle to reveal.
 */
export function SensitiveField({ value, revealValue, visibleTo = ["super_admin"], className }: SensitiveFieldProps) {
    const [revealed, setRevealed] = useState(false);
    const { adminRole } = useAdmin();

    const isAuthorized = adminRole !== null && visibleTo.includes(adminRole as AdminRole);

    if (!value) {
        return (
            <span className={cn("text-surface-400 italic text-xs", className)}>
                Non-répertorié
            </span>
        );
    }

    // Non-authorized: show masked value only
    if (!isAuthorized) {
        return (
            <span
                className={cn(
                    "font-mono text-[11px] text-surface-400 tracking-widest select-none",
                    className
                )}
                title="Accès restreint"
                aria-label="Valeur masquée — accès restreint"
            >
                {value}
            </span>
        );
    }

    const canReveal = Boolean(revealValue);

    // Authorized: toggle between masked and revealed
    return (
        <span className={cn("inline-flex items-center gap-1.5 group", className)}>
            <span
                className={cn(
                    "font-mono text-[11px] tracking-widest transition-all duration-200",
                    revealed
                        ? "text-surface-900 dark:text-white select-text"
                        : "text-surface-500 dark:text-surface-400 select-none"
                )}
                aria-live="polite"
            >
                {revealed && canReveal ? revealValue : value}
            </span>
            {canReveal && (
                <button
                    type="button"
                    onClick={() => setRevealed((prev) => !prev)}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-0.5 rounded text-surface-400 hover:text-surface-700 dark:hover:text-surface-200"
                    aria-label={revealed ? "Masquer la valeur" : "Révéler la valeur"}
                    title={revealed ? "Masquer" : "Révéler"}
                >
                    {revealed ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
            )}
        </span>
    );
}
