"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Save, ImagePlus, Upload } from "lucide-react";
import { Card, Button, Input, Textarea, Select, Toggle, toast, useLocale, useDashboard } from "@kbouffe/module-core/ui";

import { ProductOptionEditor } from "./ProductOptionEditor";
import { useCategories, createProduct, updateProduct as apiUpdateProduct } from "../hooks/use-catalog";
import { useUploadImage } from "../hooks/use-upload-image";
import type { Product, ProductOption } from "../lib/types";

interface ProductFormProps {
    product?: Product;
}

export function ProductForm({ product }: ProductFormProps) {
    const router = useRouter();
    const { t } = useLocale();
    const dashboard = useDashboard();
    const effectiveRestaurantId = dashboard?.restaurant?.id;
    const { categories } = useCategories(effectiveRestaurantId);
    const isEditing = !!product;

    const [form, setForm] = useState({
        name: product?.name ?? "",
        description: product?.description ?? "",
        price: product?.price?.toString() ?? "",
        compareAtPrice: product?.compare_at_price?.toString() ?? "",
        categoryId: product?.category_id ?? "",
        isAvailable: product?.is_available ?? true,
        allergens: product?.tags ? (JSON.parse(product.tags as string) as string[]).join(", ") : "", // Re-using tags or specific allergens field
        isHalal: (product as any)?.is_halal ?? false,
        isVegan: (product as any)?.is_vegan ?? false,
        isGlutenFree: (product as any)?.is_gluten_free ?? false,
        healthAccepted: false,
    });
    const [options, setOptions] = useState<ProductOption[]>(
        (product?.options as unknown as ProductOption[]) ?? []
    );
    const [imageUrl, setImageUrl] = useState<string | null>(product?.image_url ?? null);
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { upload, uploading } = useUploadImage();

    const updateField = (field: string, value: unknown) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const categoryOptions = categories.filter((c: any) => c.is_active).map((c: any) => ({
        value: c.id,
        label: c.name,
    }));

    const handleImageUpload = async (file: File) => {
        if (!file) return;

        try {
            const data = await upload(file);
            if (data?.url) {
                setImageUrl(data.url);
                toast.success((t.menu as Record<string, string>).imageUploaded ?? "Image uploadée ✨");
            } else {
                toast.error("Impossible d'uploader l'image. Vérifiez la console pour plus de détails.");
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            toast.error(`Erreur upload: ${errorMsg}`);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleImageUpload(file);
    };

    const handleDrag = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith("image/")) {
            handleImageUpload(file);
        } else {
            toast.error("Veuillez déposer une image valide");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) { toast.error(t.menu.nameRequired); return; }
        if (!form.price || Number(form.price) <= 0) { toast.error(t.menu.priceRequired); return; }
        
        if (!form.healthAccepted) {
            toast.error(t.menu.healthResponsibility);
            return;
        }

        setLoading(true);

        const productData = {
            name: form.name.trim(),
            description: form.description.trim() || null,
            price: Number(form.price),
            compare_at_price: form.compareAtPrice ? Number(form.compareAtPrice) : null,
            category_id: form.categoryId || null,
            image_url: imageUrl,
            is_available: form.isAvailable,
            allergens: form.allergens ? JSON.stringify(form.allergens.split(",").map(a => a.trim())) : null,
            is_halal: form.isHalal,
            is_vegan: form.isVegan,
            is_gluten_free: form.isGlutenFree,
            options: (options.length > 0 ? options : null) as unknown as undefined,
        };

        if (isEditing && product) {
            const { error } = await apiUpdateProduct(product.id, productData as any);
            if (error) { toast.error(error); setLoading(false); return; }
            toast.success(t.menu.productUpdated);
        } else {
            const { error } = await createProduct(productData as any);
            if (error) { toast.error(error); setLoading(false); return; }
            toast.success(t.menu.productCreated);
        }

        setLoading(false);
        router.push("/dashboard/menu");
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <h3 className="font-semibold text-surface-900 dark:text-white mb-4">{t.menu.productInfo}</h3>
                        <div className="space-y-4">
                            <Input
                                label={t.menu.productNameLabel}
                                placeholder={t.menu.productNamePlaceholder}
                                value={form.name}
                                onChange={(e) => updateField("name", e.target.value)}
                            />
                            <Textarea
                                label={t.menu.productDescription}
                                placeholder={t.menu.productDescPlaceholder}
                                value={form.description}
                                onChange={(e) => updateField("description", e.target.value)}
                                rows={4}
                            />
                        </div>
                    </Card>

                    <Card>
                        <h3 className="font-semibold text-surface-900 dark:text-white mb-4">{t.menu.productImage}</h3>
                        <label
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer block ${
                                dragActive
                                    ? "border-brand-400 bg-brand-50/50 dark:bg-brand-900/20"
                                    : "border-surface-200 dark:border-surface-700 hover:border-brand-300 dark:hover:border-brand-700"
                            } ${uploading ? "opacity-50 cursor-wait" : ""}`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileInputChange}
                                className="hidden"
                                disabled={uploading}
                            />
                            {imageUrl ? (
                                <div className="space-y-2">
                                    <img src={imageUrl} alt="Product" className="w-32 h-32 object-cover rounded-lg mx-auto" />
                                    <p className="text-xs text-surface-500">{t.menu.productImageHint}</p>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="text-xs text-brand-600 hover:text-brand-700 underline disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Changer l'image
                                    </button>
                                </div>
                            ) : uploading ? (
                                <div className="space-y-2">
                                    <Upload size={32} className="mx-auto text-brand-500 animate-pulse" />
                                    <p className="text-sm text-surface-500">Upload en cours...</p>
                                </div>
                            ) : (
                                <div className="cursor-pointer">
                                    <ImagePlus size={32} className="mx-auto text-surface-400 mb-3" />
                                    <p className="text-sm font-medium text-surface-700 dark:text-surface-300">{t.menu.productImageDrop}</p>
                                    <p className="text-xs text-surface-400 mt-1">{t.menu.productImageHint}</p>
                                </div>
                            )}
                        </label>
                    </Card>

                    <Card>
                        <ProductOptionEditor options={options} onChange={setOptions} />
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <h3 className="font-semibold text-surface-900 dark:text-white mb-4">{t.menu.pricing}</h3>
                        <div className="space-y-4">
                            <Input
                                label={t.menu.priceFCFA}
                                type="number"
                                placeholder="0"
                                value={form.price}
                                onChange={(e) => updateField("price", e.target.value)}
                            />
                            <Input
                                label={t.menu.comparePrice}
                                type="number"
                                placeholder={t.menu.comparePricePlaceholder}
                                value={form.compareAtPrice}
                                onChange={(e) => updateField("compareAtPrice", e.target.value)}
                                hint={t.menu.comparePriceHint}
                            />
                        </div>
                    </Card>

                    <Card>
                        <h3 className="font-semibold text-surface-900 dark:text-white mb-4">{t.menu.organization}</h3>
                        <div className="space-y-4">
                            <Select
                                label={t.menu.category}
                                options={categoryOptions}
                                value={form.categoryId}
                                onChange={(e) => updateField("categoryId", e.target.value)}
                                placeholder={t.menu.selectCategory}
                            />
                            <Toggle
                                checked={form.isAvailable}
                                onChange={(val) => updateField("isAvailable", val)}
                                label={t.menu.productAvailable}
                                description={t.menu.productAvailableHint}
                            />
                        </div>
                    </Card>

                    <Card>
                        <h3 className="font-semibold text-surface-900 dark:text-white mb-4">{t.menu.dietaryHealth}</h3>
                        <div className="space-y-4">
                            <Input
                                label={t.menu.allergens}
                                placeholder="Lait, Gluten, Arachides..."
                                value={form.allergens}
                                onChange={(e) => updateField("allergens", e.target.value)}
                                hint={t.menu.healthResponsibilityNotice}
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2">
                                <Toggle
                                    checked={form.isHalal}
                                    onChange={(val) => updateField("isHalal", val)}
                                    label={t.menu.isHalal}
                                />
                                <Toggle
                                    checked={form.isVegan}
                                    onChange={(val) => updateField("isVegan", val)}
                                    label={t.menu.isVegan}
                                />
                                <Toggle
                                    checked={form.isGlutenFree}
                                    onChange={(val) => updateField("isGlutenFree", val)}
                                    label={t.menu.isGlutenFree}
                                />
                            </div>
                            <div className="pt-4 border-t border-surface-100 dark:border-surface-800">
                                <div className="flex items-start gap-3 p-3 bg-brand-50/50 dark:bg-brand-900/20 rounded-lg">
                                    <input
                                        type="checkbox"
                                        id="healthAccepted"
                                        checked={form.healthAccepted}
                                        onChange={(e) => updateField("healthAccepted", e.target.checked)}
                                        className="mt-1 h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-600 cursor-pointer"
                                    />
                                    <label htmlFor="healthAccepted" className="text-xs text-brand-900 dark:text-brand-100 cursor-pointer leading-relaxed">
                                        {t.menu.healthResponsibilityNotice}
                                    </label>
                                </div>
                            </div>
                        </div>
                    </Card>
                    <Button type="submit" className="w-full" leftIcon={<Save size={18} />} isLoading={loading}>
                        {isEditing ? t.menu.saveChanges : t.menu.createProduct}
                    </Button>
                </div>
            </div>
        </form>
    );
}
