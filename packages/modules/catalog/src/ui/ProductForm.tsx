"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, ImagePlus, Upload, Trash2, PlusCircle, Link2 } from "lucide-react";
import { Card, Button, Input, Textarea, Select, Toggle, toast, useLocale, useDashboard, authFetch } from "@kbouffe/module-core/ui";

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
    const [imageMode, setImageMode] = useState<"file" | "url">("file");
    const [urlInput, setUrlInput] = useState("");
    const [galleryUrlInput, setGalleryUrlInput] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { upload, uploading } = useUploadImage();

    const handleUrlSubmit = () => {
        const url = urlInput.trim();
        if (!url) return;
        try { new URL(url); } catch { toast.error("URL invalide"); return; }
        setImageUrl(url);
        setUrlInput("");
        toast.success("Image ajoutée via URL");
    };

    // Extra images gallery (only when editing)
    const [extraImages, setExtraImages] = useState<{ id: string; url: string; display_order: number }[]>([]);
    const [galleryUploading, setGalleryUploading] = useState(false);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isEditing || !product?.id) return;
        authFetch(`/api/products/${product.id}/images`)
            .then((r) => r.json())
            .then((data: any) => setExtraImages(data.images ?? []))
            .catch(() => {});
    }, [isEditing, product?.id]);

    const handleGalleryUpload = async (file: File) => {
        if (!file || !product?.id) return;
        setGalleryUploading(true);
        try {
            const uploadData = await upload(file);
            if (!uploadData?.url) { toast.error("Impossible d'uploader l'image."); return; }
            const res = await authFetch(`/api/products/${product.id}/images`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: uploadData.url, display_order: extraImages.length }),
            });
            const json = await res.json() as any;
            if (json.success) {
                setExtraImages((prev) => [...prev, json.image]);
                toast.success("Image ajoutée à la galerie");
            } else {
                toast.error(json.error ?? "Erreur lors de l'ajout.");
            }
        } finally {
            setGalleryUploading(false);
        }
    };

    const handleDeleteGalleryImage = async (imageId: string) => {
        if (!product?.id) return;
        const res = await authFetch(`/api/products/${product.id}/images/${imageId}`, { method: "DELETE" });
        const json = await res.json() as any;
        if (json.success) {
            setExtraImages((prev) => prev.filter((img) => img.id !== imageId));
            toast.success("Image supprimée");
        } else {
            toast.error(json.error ?? "Erreur lors de la suppression.");
        }
    };

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
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-surface-900 dark:text-white">{t.menu.productImage}</h3>
                            <div className="flex gap-1 p-0.5 bg-surface-100 dark:bg-surface-800 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setImageMode("file")}
                                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${imageMode === "file" ? "bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm" : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"}`}
                                >
                                    <Upload size={12} /> Fichier
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setImageMode("url")}
                                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${imageMode === "url" ? "bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm" : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"}`}
                                >
                                    <Link2 size={12} /> URL
                                </button>
                            </div>
                        </div>

                        {/* Current image preview */}
                        {imageUrl && (
                            <div className="mb-4 text-center space-y-2">
                                <img src={imageUrl} alt="Product" className="w-32 h-32 object-cover rounded-lg mx-auto" />
                                <button
                                    type="button"
                                    onClick={() => setImageUrl(null)}
                                    className="text-xs text-red-500 hover:text-red-600 underline"
                                >
                                    Supprimer l'image
                                </button>
                            </div>
                        )}

                        {imageMode === "file" ? (
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
                                {uploading ? (
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
                        ) : (
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    value={urlInput}
                                    onChange={(e) => setUrlInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleUrlSubmit(); } }}
                                    placeholder="https://exemple.com/image-produit.jpg"
                                    className="flex-1 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2.5 text-sm text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                />
                                <button
                                    type="button"
                                    onClick={handleUrlSubmit}
                                    className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-semibold transition-colors shrink-0"
                                >
                                    Ajouter
                                </button>
                            </div>
                        )}
                    </Card>

                    <Card>
                        <ProductOptionEditor options={options} onChange={setOptions} />
                    </Card>

                    {/* Extra images gallery — only when editing */}
                    {isEditing && (
                        <Card>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-surface-900 dark:text-white">Galerie d'images</h3>
                                <span className="text-xs text-surface-400">{extraImages.length} photo{extraImages.length !== 1 ? "s" : ""} supplémentaire{extraImages.length !== 1 ? "s" : ""}</span>
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
                                {extraImages.map((img) => (
                                    <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden border border-surface-200 dark:border-surface-700">
                                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteGalleryImage(img.id)}
                                            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={18} className="text-white" />
                                        </button>
                                    </div>
                                ))}
                                <label className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${galleryUploading ? "opacity-50 cursor-wait border-surface-300 dark:border-surface-600" : "border-surface-200 dark:border-surface-700 hover:border-brand-400"}`}>
                                    <input
                                        ref={galleryInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        disabled={galleryUploading}
                                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleGalleryUpload(f); }}
                                    />
                                    {galleryUploading
                                        ? <Upload size={20} className="text-brand-500 animate-pulse" />
                                        : <><PlusCircle size={20} className="text-surface-400 mb-1" /><span className="text-xs text-surface-400">Fichier</span></>
                                    }
                                </label>
                            </div>
                            {/* Add gallery image via URL */}
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="url"
                                    value={galleryUrlInput}
                                    onChange={(e) => setGalleryUrlInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            const url = galleryUrlInput.trim();
                                            if (!url) return;
                                            try { new URL(url); } catch { toast.error("URL invalide"); return; }
                                            (async () => {
                                                setGalleryUploading(true);
                                                try {
                                                    const res = await authFetch(`/api/products/${product!.id}/images`, {
                                                        method: "POST",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify({ url, display_order: extraImages.length }),
                                                    });
                                                    const json = await res.json() as any;
                                                    if (json.success) { setExtraImages(prev => [...prev, json.image]); setGalleryUrlInput(""); toast.success("Image ajoutée"); }
                                                    else toast.error(json.error ?? "Erreur");
                                                } finally { setGalleryUploading(false); }
                                            })();
                                        }
                                    }}
                                    placeholder="https://exemple.com/photo.jpg"
                                    className="flex-1 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                />
                                <button
                                    type="button"
                                    disabled={galleryUploading}
                                    onClick={async () => {
                                        const url = galleryUrlInput.trim();
                                        if (!url) return;
                                        try { new URL(url); } catch { toast.error("URL invalide"); return; }
                                        setGalleryUploading(true);
                                        try {
                                            const res = await authFetch(`/api/products/${product!.id}/images`, {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ url, display_order: extraImages.length }),
                                            });
                                            const json = await res.json() as any;
                                            if (json.success) { setExtraImages(prev => [...prev, json.image]); setGalleryUrlInput(""); toast.success("Image ajoutée"); }
                                            else toast.error(json.error ?? "Erreur");
                                        } finally { setGalleryUploading(false); }
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors shrink-0"
                                >
                                    <Link2 size={14} /> Ajouter via URL
                                </button>
                            </div>
                            <p className="text-xs text-surface-400">Ajoutez des photos par fichier ou par lien URL. Elles s'affichent dans la galerie côté client.</p>
                        </Card>
                    )}
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
