"use client";

import { Store, User } from "lucide-react";
import { useLocale } from "@kbouffe/module-core/ui";
import { cn } from "@/lib/utils";

export type UserRole = "merchant" | "client";

interface RoleSelectorProps {
    selectedRole: UserRole;
    onRoleChange: (role: UserRole) => void;
    className?: string;
}

const roleIcons = {
    merchant: Store,
    client: User,
};

const roleColors = {
    merchant: {
        bg: "bg-brand-50 dark:bg-brand-900/20",
        border: "border-brand-500",
        icon: "text-brand-500",
        ring: "ring-brand-500/20",
    },
    client: {
        bg: "bg-emerald-50 dark:bg-emerald-900/20",
        border: "border-emerald-500",
        icon: "text-emerald-500",
        ring: "ring-emerald-500/20",
    },
};

export function RoleSelector({ selectedRole, onRoleChange, className }: RoleSelectorProps) {
    const { t } = useLocale();

    const roles: { role: UserRole; label: string; description: string }[] = [
        {
            role: "merchant",
            label: t.auth.roleRestaurant,
            description: t.auth.roleRestaurantDesc,
        },
        {
            role: "client",
            label: t.auth.roleClient,
            description: t.auth.roleClientDesc,
        },
    ];

    return (
        <div className={cn("space-y-3", className)}>
            <p className="text-sm font-medium text-surface-700 dark:text-surface-300 text-center mb-4">
                {t.auth.selectRole}
            </p>
            <div className="grid grid-cols-2 gap-4">
                {roles.map(({ role, label, description }) => {
                    const Icon = roleIcons[role];
                    const colors = roleColors[role];
                    const isSelected = selectedRole === role;

                    return (
                        <button
                            key={role}
                            type="button"
                            onClick={() => onRoleChange(role)}
                            className={cn(
                                "relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200",
                                "hover:shadow-md focus:outline-none focus:ring-2",
                                isSelected
                                    ? `${colors.bg} ${colors.border} ${colors.ring} ring-4`
                                    : "bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600"
                            )}
                        >
                            <div
                                className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors",
                                    isSelected
                                        ? `${colors.bg} ${colors.icon}`
                                        : "bg-surface-100 dark:bg-surface-700 text-surface-500"
                                )}
                            >
                                <Icon size={24} />
                            </div>
                            <span
                                className={cn(
                                    "font-semibold text-sm transition-colors",
                                    isSelected ? "text-surface-900 dark:text-white" : "text-surface-700 dark:text-surface-300"
                                )}
                            >
                                {label}
                            </span>
                            <span className="text-xs text-surface-500 dark:text-surface-400 text-center mt-1 line-clamp-2">
                                {description}
                            </span>
                            {isSelected && (
                                <div
                                    className={cn(
                                        "absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center",
                                        role === "merchant" && "bg-brand-500",
                                        role === "client" && "bg-emerald-500"
                                    )}
                                >
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
