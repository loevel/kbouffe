import type { ReactNode, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    padding?: "none" | "sm" | "md" | "lg";
}

const paddingStyles = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
};

export function Card({ children, className, padding = "md", ...props }: CardProps) {
    return (
        <div
            className={cn(
                "rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm",
                paddingStyles[padding],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}

export function CardHeader({ children, className, ...props }: CardHeaderProps) {
    return (
        <div
            className={cn("pb-4 border-b border-surface-100 dark:border-surface-800", className)}
            {...props}
        >
            {children}
        </div>
    );
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
    children: ReactNode;
}

export function CardTitle({ children, className, ...props }: CardTitleProps) {
    return (
        <h3
            className={cn("text-lg font-semibold text-surface-900 dark:text-white", className)}
            {...props}
        >
            {children}
        </h3>
    );
}

interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
    children: ReactNode;
}

export function CardDescription({ children, className, ...props }: CardDescriptionProps) {
    return (
        <p
            className={cn("text-sm text-surface-500 dark:text-surface-400 mt-1", className)}
            {...props}
        >
            {children}
        </p>
    );
}
