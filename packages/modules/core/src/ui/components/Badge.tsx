import type { ReactNode } from "react";
import { cn } from "../lib/utils";

type BadgeVariant =
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "brand"
    | "outline";

interface BadgeProps {
    children: ReactNode;
    variant?: BadgeVariant;
    className?: string;
    dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
    default:
        "bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-300",
    success:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    warning:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    danger:
        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    info:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    brand:
        "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400",
    outline:
        "bg-transparent border border-surface-200 text-surface-600 dark:border-surface-700 dark:text-surface-400",
};

const dotStyles: Record<BadgeVariant, string> = {
    default: "bg-surface-500",
    success: "bg-green-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
    info: "bg-blue-500",
    brand: "bg-brand-500",
    outline: "bg-surface-400",
};

export function Badge({ children, variant = "default", className, dot }: BadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
                variantStyles[variant],
                className
            )}
        >
            {dot && (
                <span
                    className={cn("h-1.5 w-1.5 rounded-full", dotStyles[variant])}
                />
            )}
            {children}
        </span>
    );
}
