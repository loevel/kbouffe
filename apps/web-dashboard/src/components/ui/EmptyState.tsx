import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PackageOpen } from "lucide-react";

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
}

export function EmptyState({
    icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center py-16 px-6 text-center",
                className
            )}
        >
            <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-6 text-surface-400 dark:text-surface-500">
                {icon || <PackageOpen size={32} />}
            </div>
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
                {title}
            </h3>
            {description && (
                <p className="text-surface-500 dark:text-surface-400 max-w-sm mb-6">
                    {description}
                </p>
            )}
            {action}
        </div>
    );
}
