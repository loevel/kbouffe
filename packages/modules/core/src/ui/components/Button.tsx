import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/utils";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary:
        "bg-brand-500 hover:bg-brand-600 text-white shadow-md shadow-brand-500/20 hover:shadow-brand-500/40",
    secondary:
        "bg-surface-100 hover:bg-surface-200 text-surface-900 dark:bg-surface-800 dark:hover:bg-surface-700 dark:text-white",
    outline:
        "border border-surface-200 dark:border-surface-700 bg-transparent hover:bg-surface-50 dark:hover:bg-surface-800 text-surface-900 dark:text-white",
    ghost:
        "bg-transparent hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-300",
    danger:
        "bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/20",
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: "px-3 py-1.5 text-sm rounded-lg gap-1.5",
    md: "px-4 py-2.5 text-sm rounded-xl gap-2",
    lg: "px-6 py-3 text-base rounded-xl gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant = "primary",
            size = "md",
            isLoading = false,
            leftIcon,
            rightIcon,
            disabled,
            children,
            ...props
        },
        ref
    ) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-surface-900 disabled:opacity-50 disabled:cursor-not-allowed",
                    variantStyles[variant],
                    sizeStyles[size],
                    className
                )}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading ? (
                    <Loader2 size={size === "sm" ? 14 : 18} className="animate-spin" />
                ) : (
                    leftIcon
                )}
                {children}
                {!isLoading && rightIcon}
            </button>
        );
    }
);

Button.displayName = "Button";
