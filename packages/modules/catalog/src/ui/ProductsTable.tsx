"use client";

import { useState, useMemo } from "react";
import { Search, Edit, Trash2, Copy, UtensilsCrossed, Eye, EyeOff, Beer, GlassWater, CupSoda, Zap, Image as ImageIcon, ExternalLink } from "lucide-react";
import { Card, Input, Select, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TablePagination, Toggle, Badge, EmptyState, Dropdown, toast, useLocale, formatCFA } from "@kbouffe/module-core/ui";

import { useProducts, useCategories, updateProduct, deleteProduct as apiDeleteProduct, createProduct } from "@/hooks/use-data";

const ITEMS_PER_PAGE = 10;

type AvailabilityFilter = "all" | "available" | "unavailable";

function getCategoryIcon(categoryName: string) {
    const lower = categoryName.toLowerCase();
    if (lower.includes("biere")) return <Beer size={16} />;
    if (lower.includes("gazeuse") || lower.includes("jus")) return <CupSoda size={16} />;
    if (lower.includes("eau")) return <GlassWater size={16} />;
    if (lower.includes("energi")) return <Zap size={16} />;
    return <UtensilsCrossed size={16} />;
}

function getSourceBadge(description: string | null) {
    const badges: React.ReactNode[] = [];
    if (description?.toLowerCase().includes("boissonsducameroun.com")) {
        badges.push(
            <span key="bdc" className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded-full">
                <ExternalLink size={8} />
                BDC
            </span>
        );
    }
    if (description?.toLowerCase().includes("sa-ucb.com")) {
        badges.push(
            <span key="ucb" className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full">
                <ExternalLink size={8} />
                UCB
            </span>
        );
    }
    return badges.length > 0 ? <span className="flex gap-1">{badges}</span> : null;
}

export function ProductsTable() {
    const { t } = useLocale();
    const { products, isLoading: productsLoading, mutate: mutateProducts } = useProducts();
    const { categories } = useCategories();
    const [categoryFilter, setCategoryFilter] = useState("");
    const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>("all");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const categoryOptions = [
        { value: "", label: t.menu.allCategories },
        ...categories.map(c => ({ value: c.id, label: `${c.name} (${products.filter(p => p.category_id === c.id).length})` })),
    ];

    const availabilityOptions = [
        { value: "all", label: t.menu.allStatuses },
        { value: "available", label: t.menu.filterAvailable },
        { value: "unavailable", label: t.menu.filterUnavailable },
    ];

    const filtered = useMemo(() => {
        let prods = products;
        if (categoryFilter) {
            prods = prods.filter(p => p.category_id === categoryFilter);
        }
        if (availabilityFilter === "available") {
            prods = prods.filter(p => p.is_available);
        } else if (availabilityFilter === "unavailable") {
            prods = prods.filter(p => !p.is_available);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            prods = prods.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.description?.toLowerCase().includes(q)
            );
        }
        return prods;
    }, [products, categoryFilter, availabilityFilter, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    const getCategoryName = (categoryId: string | null) => {
        if (!categoryId) return "\u2014";
        return categories.find(c => c.id === categoryId)?.name ?? "\u2014";
    };

    const getCategoryDescription = (categoryId: string | null) => {
        if (!categoryId) return null;
        return categories.find(c => c.id === categoryId)?.description ?? null;
    };

    const toggleAvailability = async (productId: string) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;
        const { error } = await updateProduct(productId, { is_available: !product.is_available });
        if (error) { toast.error(error); return; }
        mutateProducts();
        toast.success(t.menu.availabilityUpdated);
    };

    const toggleSelect = (productId: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(productId)) next.delete(productId);
            else next.add(productId);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === paginated.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(paginated.map(p => p.id)));
        }
    };

    const bulkToggleAvailability = async (available: boolean) => {
        const promises = Array.from(selectedIds).map(id => updateProduct(id, { is_available: available }));
        await Promise.all(promises);
        mutateProducts();
        toast.success(`${selectedIds.size} ${available ? t.menu.productsActivated : t.menu.productsDeactivated}`);
        setSelectedIds(new Set());
    };

    const bulkDelete = async () => {
        const promises = Array.from(selectedIds).map(id => apiDeleteProduct(id));
        await Promise.all(promises);
        mutateProducts();
        toast.success(`${selectedIds.size} ${t.menu.productsDeleted}`);
        setSelectedIds(new Set());
    };

    const duplicateProduct = async (product: typeof products[0]) => {
        const { error } = await createProduct({
            name: `${product.name} (copie)`,
            description: product.description,
            price: product.price,
            compare_at_price: product.compare_at_price,
            category_id: product.category_id,
            image_url: product.image_url,
            is_available: product.is_available,
            options: product.options,
        });
        if (error) { toast.error(error); return; }
        mutateProducts();
        toast.success(t.menu.productDuplicated);
    };

    const handleDeleteProduct = async (productId: string) => {
        const { error } = await apiDeleteProduct(productId);
        if (error) { toast.error(error); return; }
        mutateProducts();
        toast.success(t.menu.productDeleted);
    };

    return (
        <Card padding="none">
            {/* Filters bar */}
            <div className="p-4 flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                        <Input
                            placeholder={t.menu.searchPlaceholder}
                            leftIcon={<Search size={18} />}
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>
                    <div className="w-full sm:w-56">
                        <Select
                            options={categoryOptions}
                            value={categoryFilter}
                            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                        />
                    </div>
                    <div className="w-full sm:w-48">
                        <Select
                            options={availabilityOptions}
                            value={availabilityFilter}
                            onChange={(e) => { setAvailabilityFilter(e.target.value as AvailabilityFilter); setPage(1); }}
                        />
                    </div>
                </div>

                {/* Quick category pills */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => { setCategoryFilter(""); setPage(1); }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!categoryFilter ? "bg-brand-500 text-white" : "bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700"}`}
                    >
                        Tous ({products.length})
                    </button>
                    {categories.filter(c => c.is_active).map(cat => {
                        const count = products.filter(p => p.category_id === cat.id).length;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => { setCategoryFilter(cat.id); setPage(1); }}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${categoryFilter === cat.id ? "bg-brand-500 text-white" : "bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700"}`}
                            >
                                {getCategoryIcon(cat.name)}
                                {cat.name} ({count})
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Bulk actions bar */}
            {selectedIds.size > 0 && (
                <div className="px-4 py-3 bg-brand-50 dark:bg-brand-900/20 border-y border-brand-100 dark:border-brand-800 flex items-center justify-between">
                    <span className="text-sm font-medium text-brand-700 dark:text-brand-300">
                        {selectedIds.size} {t.menu.selectedProducts}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => bulkToggleAvailability(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                        >
                            <Eye size={14} />
                            {t.menu.bulkActivate}
                        </button>
                        <button
                            onClick={() => bulkToggleAvailability(false)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
                        >
                            <EyeOff size={14} />
                            {t.menu.bulkDeactivate}
                        </button>
                        <button
                            onClick={bulkDelete}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                        >
                            <Trash2 size={14} />
                            {t.menu.bulkDelete}
                        </button>
                    </div>
                </div>
            )}

            {paginated.length === 0 ? (
                <EmptyState
                    icon={<UtensilsCrossed size={32} />}
                    title={t.menu.noProducts}
                    description={search ? t.menu.noProductsSearch : t.menu.noProductsFirst}
                />
            ) : (
                <>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-10">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.size === paginated.length && paginated.length > 0}
                                        onChange={toggleSelectAll}
                                        className="rounded border-surface-300 dark:border-surface-600 text-brand-500 focus:ring-brand-500"
                                    />
                                </TableHead>
                                <TableHead>{t.menu.productName}</TableHead>
                                <TableHead>{t.menu.category}</TableHead>
                                <TableHead>{t.menu.price}</TableHead>
                                <TableHead>{t.menu.options}</TableHead>
                                <TableHead>{t.common.available}</TableHead>
                                <TableHead className="text-right">{t.common.actions}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginated.map((product) => (
                                <TableRow key={product.id} className={selectedIds.has(product.id) ? "bg-brand-50/50 dark:bg-brand-900/10" : ""}>
                                    <TableCell>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(product.id)}
                                            onChange={() => toggleSelect(product.id)}
                                            className="rounded border-surface-300 dark:border-surface-600 text-brand-500 focus:ring-brand-500"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            {product.image_url ? (
                                                <div className="w-10 h-10 rounded-xl overflow-hidden bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                                                    <img
                                                        src={product.image_url}
                                                        alt={product.name}
                                                        className="w-full h-full object-contain"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.style.display = "none";
                                                            target.parentElement!.innerHTML = `<div class="flex items-center justify-center w-full h-full text-surface-400"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`;
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-400">
                                                    {getCategoryIcon(getCategoryName(product.category_id))}
                                                </div>
                                            )}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-surface-900 dark:text-white">{product.name}</p>
                                                    {getSourceBadge(getCategoryDescription(product.category_id))}
                                                </div>
                                                {product.description && (
                                                    <p className="text-xs text-surface-500 line-clamp-1 max-w-[250px]">{product.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="default">{getCategoryName(product.category_id)}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <span className="font-medium text-surface-900 dark:text-white">{formatCFA(product.price)}</span>
                                            {product.compare_at_price && (
                                                <span className="text-xs text-surface-400 line-through ml-2">{formatCFA(product.compare_at_price)}</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {product.options ? (
                                            <span className="text-xs text-surface-500">
                                                {((product.options as unknown as Array<{ name: string }>)?.length ?? 0)} option(s)
                                            </span>
                                        ) : (
                                            <span className="text-xs text-surface-400">\u2014</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Toggle
                                            checked={product.is_available}
                                            onChange={() => toggleAvailability(product.id)}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Dropdown
                                            items={[
                                                { label: "Modifier", icon: <Edit size={14} />, onClick: () => { window.location.href = `/dashboard/menu/${product.id}`; } },
                                                { label: "Dupliquer", icon: <Copy size={14} />, onClick: () => duplicateProduct(product) },
                                                { label: "Supprimer", icon: <Trash2 size={14} />, onClick: () => handleDeleteProduct(product.id), variant: "danger" as const },
                                            ]}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="px-4 py-3 flex items-center justify-between border-t border-surface-100 dark:border-surface-800">
                        <p className="text-xs text-surface-500">
                            {filtered.length} {t.menu.productCount}
                            {categoryFilter && ` ${t.menu.inCategory} "${getCategoryName(categoryFilter)}"`}
                        </p>
                        {totalPages > 1 && (
                            <TablePagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                        )}
                    </div>
                </>
            )}
        </Card>
    );
}
