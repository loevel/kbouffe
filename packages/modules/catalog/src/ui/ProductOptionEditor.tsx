"use client";

import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button, Input, Toggle, useLocale } from "@kbouffe/module-core/ui";
import type { ProductOption } from "@kbouffe/module-core/ui"; // This one is fine as it's from core

interface ProductOptionEditorProps {
    options: ProductOption[];
    onChange: (options: ProductOption[]) => void;
}

export function ProductOptionEditor({ options, onChange }: ProductOptionEditorProps) {
    const { t } = useLocale();
    const addOption = () => {
        onChange([...options, { name: "", required: false, min_selections: 1, max_selections: 1, choices: [{ label: "", extra_price: 0 }] }]);
    };

    const removeOption = (index: number) => {
        onChange(options.filter((_, i) => i !== index));
    };

    const updateOption = (index: number, field: keyof ProductOption, value: unknown) => {
        const updated = [...options];
        (updated[index] as any)[field] = value;
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
        (updated[optionIndex].choices[choiceIndex] as any)[field] = value;
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
                <div key={optionIndex} className="border border-surface-200 dark:border-surface-700 rounded-xl p-4 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <GripVertical size={16} className="text-surface-400 shrink-0" />
                        <Input
                            placeholder={t.menu.optionNamePlaceholder}
                            value={option.name}
                            onChange={(e) => updateOption(optionIndex, "name", e.target.value)}
                            className="flex-1 min-w-[200px]"
                        />
                        <div className="flex items-center gap-4">
                            <Toggle
                                checked={option.required ?? false}
                                onChange={(val) => updateOption(optionIndex, "required", val)}
                                label={t.common.required}
                            />
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-surface-500">Min</span>
                                <input
                                    type="number"
                                    value={option.min_selections ?? 1}
                                    onChange={(e) => updateOption(optionIndex, "min_selections", parseInt(e.target.value))}
                                    className="w-12 h-8 text-center text-xs border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-900"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-surface-500">Max</span>
                                <input
                                    type="number"
                                    value={option.max_selections ?? 1}
                                    onChange={(e) => updateOption(optionIndex, "max_selections", parseInt(e.target.value))}
                                    className="w-12 h-8 text-center text-xs border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-900"
                                />
                            </div>
                        </div>
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
