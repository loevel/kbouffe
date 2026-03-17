import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, label, error, hint, id, ...props }, ref) => {
        const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={textareaId}
                        className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
                    >
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    id={textareaId}
                    className={cn(
                        "w-full px-4 py-2.5 rounded-xl border bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 transition-all resize-none",
                        "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
                        error
                            ? "border-red-500 dark:border-red-500"
                            : "border-surface-200 dark:border-surface-700",
                        className
                    )}
                    {...props}
                />
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

Textarea.displayName = "Textarea";
