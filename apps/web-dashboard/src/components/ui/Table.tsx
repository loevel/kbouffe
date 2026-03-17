"use client";

import { type ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from "lucide-react";

// --- Table Root ---

interface TableProps {
    children: ReactNode;
    className?: string;
}

export function Table({ children, className }: TableProps) {
    return (
        <div className={cn("w-full overflow-x-auto", className)}>
            <table className="w-full text-sm">{children}</table>
        </div>
    );
}

// --- Table Header ---

export function TableHeader({ children, className }: TableProps) {
    return (
        <thead
            className={cn(
                "border-b border-surface-200 dark:border-surface-800",
                className
            )}
        >
            {children}
        </thead>
    );
}

// --- Table Body ---

export function TableBody({ children, className }: TableProps) {
    return <tbody className={cn("divide-y divide-surface-100 dark:divide-surface-800", className)}>{children}</tbody>;
}

// --- Table Row ---

export function TableRow({ children, className }: TableProps) {
    return (
        <tr
            className={cn(
                "hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors",
                className
            )}
        >
            {children}
        </tr>
    );
}

// --- Table Head Cell ---

interface TableHeadProps {
    children: ReactNode;
    className?: string;
    sortable?: boolean;
    sortDirection?: "asc" | "desc" | null;
    onSort?: () => void;
}

export function TableHead({
    children,
    className,
    sortable,
    sortDirection,
    onSort,
}: TableHeadProps) {
    return (
        <th
            className={cn(
                "px-4 py-3 text-left text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider",
                sortable && "cursor-pointer select-none hover:text-surface-700 dark:hover:text-surface-200",
                className
            )}
            onClick={sortable ? onSort : undefined}
        >
            <span className="inline-flex items-center gap-1.5">
                {children}
                {sortable && (
                    <span className="text-surface-300 dark:text-surface-600">
                        {sortDirection === "asc" ? (
                            <ArrowUp size={14} />
                        ) : sortDirection === "desc" ? (
                            <ArrowDown size={14} />
                        ) : (
                            <ArrowUpDown size={14} />
                        )}
                    </span>
                )}
            </span>
        </th>
    );
}

// --- Table Cell ---

interface TableCellProps {
    children: ReactNode;
    className?: string;
}

export function TableCell({ children, className }: TableCellProps) {
    return (
        <td
            className={cn(
                "px-4 py-3 text-surface-700 dark:text-surface-300",
                className
            )}
        >
            {children}
        </td>
    );
}

// --- Pagination ---

interface TablePaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export function TablePagination({
    currentPage,
    totalPages,
    onPageChange,
    className,
}: TablePaginationProps) {
    return (
        <div
            className={cn(
                "flex items-center justify-between px-4 py-3 border-t border-surface-200 dark:border-surface-800",
                className
            )}
        >
            <p className="text-sm text-surface-500 dark:text-surface-400">
                Page {currentPage} sur {totalPages}
            </p>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="p-1.5 rounded-lg border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft size={16} />
                </button>
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="p-1.5 rounded-lg border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}
