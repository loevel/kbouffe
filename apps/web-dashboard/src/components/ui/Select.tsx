import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    hint?: string;
    options: SelectOption[];
    placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, label, error, hint, options, placeholder, id, ...props }, ref) => {
        const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={selectId}
                        className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    <select
                        ref={ref}
                        id={selectId}
                        className={cn(
                            "w-full py-2.5 pl-4 pr-10 rounded-xl border bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-white transition-all appearance-none",
                            "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
                            error
                                ? "border-red-500 dark:border-red-500"
                                : "border-surface-200 dark:border-surface-700",
                            className
                        )}
                        {...props}
                    >
                        {placeholder && (
                            <option value="" disabled>
                                {placeholder}
                            </option>
                        )}
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown
                        size={16}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none"
                    />
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

Select.displayName = "Select";
