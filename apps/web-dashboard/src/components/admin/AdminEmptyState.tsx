"use client";

import { motion } from "framer-motion";
import { Inbox } from "lucide-react";
import { Button } from "@kbouffe/module-core/ui";

interface AdminEmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: { label: string; onClick: () => void };
}

export function AdminEmptyState({ icon, title, description, action }: AdminEmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col items-center justify-center py-24 px-6 text-center"
        >
            <div className="w-16 h-16 rounded-2xl bg-surface-50 dark:bg-surface-800 flex items-center justify-center text-surface-300 dark:text-surface-600 mb-5">
                {icon ?? <Inbox size={28} strokeWidth={1.5} />}
            </div>
            <p className="text-lg font-semibold text-surface-900 dark:text-white mb-1.5">
                {title}
            </p>
            {description && (
                <p className="text-sm text-surface-400 dark:text-surface-500 max-w-sm mb-6">
                    {description}
                </p>
            )}
            {action && (
                <Button variant="outline" size="sm" onClick={action.onClick}>
                    {action.label}
                </Button>
            )}
        </motion.div>
    );
}
