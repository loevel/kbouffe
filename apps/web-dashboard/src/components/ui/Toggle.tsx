"use client";

import { cn } from "@/lib/utils";

interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    description?: string;
    disabled?: boolean;
    className?: string;
}

export function Toggle({
    checked,
    onChange,
    label,
    description,
    disabled,
    className,
}: ToggleProps) {
    return (
        <label
            className={cn(
                "flex items-center gap-3 cursor-pointer",
                disabled && "opacity-50 cursor-not-allowed",
                className
            )}
        >
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => !disabled && onChange(!checked)}
                className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0",
                    checked
                        ? "bg-brand-500"
                        : "bg-surface-300 dark:bg-surface-600"
                )}
            >
                <span
                    className={cn(
                        "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                        checked ? "translate-x-6" : "translate-x-1"
                    )}
                />
            </button>
            {(label || description) && (
                <div>
                    {label && (
                        <span className="text-sm font-medium text-surface-900 dark:text-white">
                            {label}
                        </span>
                    )}
                    {description && (
                        <p className="text-xs text-surface-500 dark:text-surface-400">
                            {description}
                        </p>
                    )}
                </div>
            )}
        </label>
    );
}
