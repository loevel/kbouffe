import { useState, useMemo, useCallback } from "react";

export function useBulkSelection(items: { id: string }[]) {
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const toggleItem = useCallback((id: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const toggleAll = useCallback(() => {
        setSelected((prev) => {
            if (prev.size === items.length && items.length > 0) {
                return new Set();
            }
            return new Set(items.map((i) => i.id));
        });
    }, [items]);

    const isSelected = useCallback((id: string) => selected.has(id), [selected]);

    const clearSelection = useCallback(() => setSelected(new Set()), []);

    const isAllSelected = items.length > 0 && selected.size === items.length;
    const isIndeterminate = selected.size > 0 && selected.size < items.length;
    const selectedCount = selected.size;
    const selectedIds = useMemo(() => Array.from(selected), [selected]);

    return {
        selected,
        toggleItem,
        toggleAll,
        isSelected,
        isAllSelected,
        isIndeterminate,
        clearSelection,
        selectedCount,
        selectedIds,
    };
}
