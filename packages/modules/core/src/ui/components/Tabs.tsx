"use client";

import { cn } from "../lib/utils";

interface Tab {
    id: string;
    label: string;
    count?: number;
}

interface TabsProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
    className?: string;
}

export function Tabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
    return (
        <div
            className={cn(
                "flex items-center gap-1 border-b border-surface-200 dark:border-surface-800",
                className
            )}
        >
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={cn(
                        "px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px",
                        activeTab === tab.id
                            ? "border-brand-500 text-brand-600 dark:text-brand-400"
                            : "border-transparent text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300 hover:border-surface-300 dark:hover:border-surface-600"
                    )}
                >
                    {tab.label}
                    {tab.count !== undefined && (
                        <span
                            className={cn(
                                "ml-2 px-1.5 py-0.5 text-xs rounded-full",
                                activeTab === tab.id
                                    ? "bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400"
                                    : "bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400"
                            )}
                        >
                            {tab.count}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}
