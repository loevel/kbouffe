import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, hint, leftIcon, rightIcon, id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none">
                            {leftIcon}
                        </span>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        className={cn(
                            "w-full py-2.5 rounded-xl border bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 transition-all",
                            "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
                            leftIcon ? "pl-11" : "pl-4",
                            rightIcon ? "pr-11" : "pr-4",
                            error
                                ? "border-red-500 dark:border-red-500"
                                : "border-surface-200 dark:border-surface-700",
                            className
                        )}
                        {...props}
                    />
                    {rightIcon && (
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400">
                            {rightIcon}
                        </span>
                    )}
                </div>
                {error && (
                    <p className="mt-1.5 text-sm text-red-500">{error}</p>
                )}
                {hint && !error && (
                    <p className="mt-1.5 text-sm text-surface-500 dark:text-surface-400">{hint}</p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";
