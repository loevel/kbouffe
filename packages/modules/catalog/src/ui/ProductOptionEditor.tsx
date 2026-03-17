"use client";

import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button, Input, Toggle } from "@/components/ui";
import { useLocale } from "@/contexts/locale-context";
import type { ProductOption } from "@/lib/supabase/types";

interface ProductOptionEditorProps {
    options: ProductOption[];
    onChange: (options: ProductOption[]) => void;
}

export function ProductOptionEditor({ options, onChange }: ProductOptionEditorProps) {
    const { t } = useLocale();
    const addOption = () => {
        onChange([...options, { name: "", required: false, choices: [{ label: "", extra_price: 0 }] }]);
    };

    const removeOption = (index: number) => {
        onChange(options.filter((_, i) => i !== index));
    };

    const updateOption = (index: number, field: keyof ProductOption, value: unknown) => {
        const updated = [...options];
        (updated[index] as unknown as Record<string, unknown>)[field] = value;
        onChange(updated);
    };

    const addChoice = (optionIndex: number) => {
        const updated = [...options];
        updated[optionIndex].choices.push({ label: "", extra_price: 0 });
        onChange(updated);
    };

    const removeChoice = (optionIndex: number, choiceIndex: number) => {
        const updated = [...options];
        updated[optionIndex].choices = updated[optionIndex].choices.filter((_, i) => i !== choiceIndex);
        onChange(updated);
    };

    const updateChoice = (optionIndex: number, choiceIndex: number, field: string, value: unknown) => {
        const updated = [...options];
        (updated[optionIndex].choices[choiceIndex] as unknown as Record<string, unknown>)[field] = value;
        onChange(updated);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-sm font-medium text-surface-900 dark:text-white">{t.menu.optionsVariants}</h4>
                    <p className="text-xs text-surface-500 mt-0.5">{t.menu.optionsHint}</p>
                </div>
                <Button variant="outline" size="sm" leftIcon={<Plus size={14} />} onClick={addOption}>
                    {t.menu.addOption}
                </Button>
            </div>

            {options.map((option, optionIndex) => (
                <div key={optionIndex} className="border border-surface-200 dark:border-surface-700 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                        <GripVertical size={16} className="text-surface-400 shrink-0" />
                        <Input
                            placeholder={t.menu.optionNamePlaceholder}
                            value={option.name}
                            onChange={(e) => updateOption(optionIndex, "name", e.target.value)}
                            className="flex-1"
                        />
                        <Toggle
                            checked={option.required ?? false}
                            onChange={(val) => updateOption(optionIndex, "required", val)}
                            label={t.common.required}
                        />
                        <button onClick={() => removeOption(optionIndex)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                            <Trash2 size={16} />
                        </button>
                    </div>

                    <div className="pl-7 space-y-2">
                        {option.choices.map((choice, choiceIndex) => (
                            <div key={choiceIndex} className="flex items-center gap-2">
                                <Input
                                    placeholder={t.menu.choicePlaceholder}
                                    value={choice.label}
                                    onChange={(e) => updateChoice(optionIndex, choiceIndex, "label", e.target.value)}
                                    className="flex-1"
                                />
                                <div className="w-32">
                                    <Input
                                        type="number"
                                        placeholder="+ FCFA"
                                        value={choice.extra_price || ""}
                                        onChange={(e) => updateChoice(optionIndex, choiceIndex, "extra_price", Number(e.target.value) || 0)}
                                    />
                                </div>
                                {option.choices.length > 1 && (
                                    <button onClick={() => removeChoice(optionIndex, choiceIndex)} className="p-1.5 text-surface-400 hover:text-red-500 transition-colors">
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            onClick={() => addChoice(optionIndex)}
                            className="text-sm text-brand-500 hover:text-brand-600 font-medium"
                        >
                            {t.menu.addChoice}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
