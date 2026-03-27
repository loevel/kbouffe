"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Camera,
    Upload,
    Loader2,
    Check,
    X,
    Sparkles,
    AlertCircle,
    ChefHat,
    Edit3,
} from "lucide-react";
import { formatCFA } from "@kbouffe/module-core/ui";
import { usePremiumCheck } from "@/hooks/use-premium";
import { PremiumUpgradeCard } from "@/components/dashboard/PremiumUpgradeCard";

// ── Types ────────────────────────────────────────────────────────────────────

interface ExtractedProduct {
    name: string;
    price: number;
    category: string;
    description: string;
    selected: boolean;
    editing: boolean;
}

// ── Main ─────────────────────────────────────────────────────────────────────

function MenuImportContent() {
    const [step, setStep] = useState<"upload" | "review" | "importing" | "done">("upload");
    const [products, setProducts] = useState<ExtractedProduct[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [importProgress, setImportProgress] = useState(0);
    const [importTotal, setImportTotal] = useState(0);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Upload & scan ────────────────────────────────────────────────────

    const handleFileSelect = async (file: File) => {
        if (!file.type.startsWith("image/")) {
            setError("Veuillez sélectionner une image");
            return;
        }

        // Preview
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target?.result as string);
        reader.readAsDataURL(file);

        // Scan with OCR
        setScanning(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append("image", file);

            const res = await fetch("/api/ai/ocr-menu", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error ?? "Erreur lors du scan");
                setScanning(false);
                return;
            }

            if (!data.products?.length) {
                setError("Aucun plat détecté. Essayez avec une photo plus nette ou un meilleur éclairage.");
                setScanning(false);
                return;
            }

            setProducts(
                data.products.map((p: any) => ({
                    ...p,
                    selected: true,
                    editing: false,
                })),
            );
            setCategories(data.categories ?? []);
            setStep("review");
        } catch {
            setError("Erreur de connexion. Vérifiez votre réseau.");
        } finally {
            setScanning(false);
        }
    };

    // ── Review actions ───────────────────────────────────────────────────

    const toggleProduct = (idx: number) => {
        setProducts((prev) =>
            prev.map((p, i) => (i === idx ? { ...p, selected: !p.selected } : p)),
        );
    };

    const updateProduct = (idx: number, field: string, value: string | number) => {
        setProducts((prev) =>
            prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)),
        );
    };

    const toggleEdit = (idx: number) => {
        setProducts((prev) =>
            prev.map((p, i) => (i === idx ? { ...p, editing: !p.editing } : p)),
        );
    };

    const removeProduct = (idx: number) => {
        setProducts((prev) => prev.filter((_, i) => i !== idx));
    };

    // ── Bulk import ──────────────────────────────────────────────────────

    const handleImport = async () => {
        const selectedProducts = products.filter((p) => p.selected);
        if (selectedProducts.length === 0) {
            setError("Sélectionnez au moins un produit");
            return;
        }

        setStep("importing");
        setImportTotal(selectedProducts.length);
        setImportProgress(0);
        setError(null);

        // First, create categories that don't exist
        const uniqueCategories = [...new Set(selectedProducts.map((p) => p.category))];
        const categoryMap: Record<string, string> = {};

        for (const catName of uniqueCategories) {
            try {
                const res = await fetch("/api/categories", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: catName }),
                });
                const data = await res.json();
                if (data.category?.id) {
                    categoryMap[catName] = data.category.id;
                } else if (data.id) {
                    categoryMap[catName] = data.id;
                }
            } catch {
                // Category might already exist — try to find it
                try {
                    const res = await fetch("/api/categories");
                    const data = await res.json();
                    const existing = (data.categories ?? data ?? []).find(
                        (c: any) => c.name.toLowerCase() === catName.toLowerCase(),
                    );
                    if (existing) categoryMap[catName] = existing.id;
                } catch {}
            }
        }

        // Then create products
        let imported = 0;
        for (const product of selectedProducts) {
            try {
                await fetch("/api/products", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: product.name,
                        description: product.description || null,
                        price: product.price,
                        category_id: categoryMap[product.category] || null,
                        is_available: true,
                    }),
                });
                imported++;
            } catch {}
            setImportProgress(imported);
        }

        setStep("done");
    };

    // ── Render ───────────────────────────────────────────────────────────

    const selectedCount = products.filter((p) => p.selected).length;

    return (
        <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <Link
                    href="/dashboard/menu"
                    className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-600 dark:text-surface-400 transition-colors"
                >
                    <ArrowLeft size={18} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
                        <Camera size={24} className="text-brand-500" />
                        Scanner un menu
                    </h1>
                    <p className="text-surface-500 dark:text-surface-400 mt-0.5 text-sm">
                        Prenez votre menu papier en photo — l&apos;IA extrait tous les plats automatiquement
                    </p>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-start gap-3 text-red-600 dark:text-red-400">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <p className="text-sm">{error}</p>
                    <button onClick={() => setError(null)} className="ml-auto">&times;</button>
                </div>
            )}

            {/* Step 1: Upload */}
            {step === "upload" && (
                <div className="space-y-4">
                    {/* Drop zone */}
                    <label
                        className={`block border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                            scanning
                                ? "border-brand-400 bg-brand-50/50 dark:bg-brand-900/20 cursor-wait"
                                : "border-surface-200 dark:border-surface-700 hover:border-brand-400 hover:bg-brand-50/30 dark:hover:bg-brand-900/10"
                        }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            disabled={scanning}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileSelect(file);
                            }}
                        />

                        {scanning ? (
                            <div className="space-y-4">
                                <Loader2 size={48} className="mx-auto text-brand-500 animate-spin" />
                                <div>
                                    <p className="text-lg font-bold text-surface-900 dark:text-white">
                                        Analyse en cours...
                                    </p>
                                    <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                                        L&apos;IA lit votre menu et extrait les plats
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/25">
                                    <Camera size={32} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-surface-900 dark:text-white">
                                        Photographiez votre menu
                                    </p>
                                    <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                                        Menu papier, tableau noir, affiche... l&apos;IA s&apos;adapte
                                    </p>
                                </div>
                                <div className="flex items-center justify-center gap-4 text-sm">
                                    <span className="inline-flex items-center gap-1.5 text-surface-400">
                                        <Camera size={14} /> Prendre une photo
                                    </span>
                                    <span className="text-surface-300">ou</span>
                                    <span className="inline-flex items-center gap-1.5 text-surface-400">
                                        <Upload size={14} /> Importer un fichier
                                    </span>
                                </div>
                            </div>
                        )}
                    </label>

                    {/* Image preview */}
                    {imagePreview && !scanning && (
                        <div className="text-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={imagePreview}
                                alt="Menu"
                                className="max-h-48 mx-auto rounded-xl border border-surface-200 dark:border-surface-700"
                            />
                        </div>
                    )}

                    {/* Tips */}
                    <div className="p-4 bg-amber-50 dark:bg-amber-500/10 rounded-2xl border border-amber-200 dark:border-amber-500/20">
                        <h3 className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2 mb-2">
                            <Sparkles size={16} />
                            Conseils pour un bon scan
                        </h3>
                        <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1">
                            <li>• Prenez la photo bien droite, sans angle</li>
                            <li>• Assurez un bon éclairage (pas de reflets)</li>
                            <li>• Tout le menu doit être visible dans la photo</li>
                            <li>• Les prix doivent être lisibles</li>
                        </ul>
                    </div>
                </div>
            )}

            {/* Step 2: Review extracted products */}
            {step === "review" && (
                <div className="space-y-4">
                    {/* Stats bar */}
                    <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-500/10 rounded-2xl border border-green-200 dark:border-green-500/20">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
                                <Check size={20} className="text-white" />
                            </div>
                            <div>
                                <p className="font-bold text-green-800 dark:text-green-300">
                                    {products.length} plat{products.length > 1 ? "s" : ""} détecté{products.length > 1 ? "s" : ""}
                                </p>
                                <p className="text-xs text-green-600 dark:text-green-400">
                                    {categories.length} catégorie{categories.length > 1 ? "s" : ""} • {selectedCount} sélectionné{selectedCount > 1 ? "s" : ""}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => { setStep("upload"); setProducts([]); setImagePreview(null); }}
                            className="text-sm text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 transition-colors"
                        >
                            Rescanner
                        </button>
                    </div>

                    {/* Product list — grouped by category */}
                    {categories.map((cat) => {
                        const catProducts = products
                            .map((p, i) => ({ ...p, idx: i }))
                            .filter((p) => p.category === cat);
                        if (catProducts.length === 0) return null;

                        return (
                            <div key={cat}>
                                <h3 className="font-bold text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                                    <ChefHat size={16} className="text-brand-500" />
                                    {cat}
                                    <span className="text-xs text-surface-400 font-normal">({catProducts.length})</span>
                                </h3>
                                <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden divide-y divide-surface-100 dark:divide-surface-800">
                                    {catProducts.map(({ idx, ...product }) => (
                                        <div
                                            key={idx}
                                            className={`p-4 transition-all ${!product.selected ? "opacity-40" : ""}`}
                                        >
                                            {product.editing ? (
                                                /* Edit mode */
                                                <div className="space-y-3">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <input
                                                            value={product.name}
                                                            onChange={(e) => updateProduct(idx, "name", e.target.value)}
                                                            className="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                                            placeholder="Nom du plat"
                                                        />
                                                        <input
                                                            type="number"
                                                            value={product.price}
                                                            onChange={(e) => updateProduct(idx, "price", parseInt(e.target.value) || 0)}
                                                            className="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                                            placeholder="Prix FCFA"
                                                        />
                                                    </div>
                                                    <input
                                                        value={product.description}
                                                        onChange={(e) => updateProduct(idx, "description", e.target.value)}
                                                        className="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                                        placeholder="Description (optionnel)"
                                                    />
                                                    <button
                                                        onClick={() => toggleEdit(idx)}
                                                        className="text-xs text-brand-500 font-semibold"
                                                    >
                                                        Terminé
                                                    </button>
                                                </div>
                                            ) : (
                                                /* View mode */
                                                <div className="flex items-center gap-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={product.selected}
                                                        onChange={() => toggleProduct(idx)}
                                                        className="h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-600 cursor-pointer shrink-0"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-sm text-surface-900 dark:text-white truncate">
                                                            {product.name}
                                                        </p>
                                                        {product.description && (
                                                            <p className="text-xs text-surface-400 truncate">{product.description}</p>
                                                        )}
                                                    </div>
                                                    <span className="font-bold text-sm text-surface-900 dark:text-white shrink-0">
                                                        {product.price > 0 ? formatCFA(product.price) : "Prix ?"}
                                                    </span>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <button
                                                            onClick={() => toggleEdit(idx)}
                                                            className="p-1.5 rounded-lg text-surface-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                                                        >
                                                            <Edit3 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => removeProduct(idx)}
                                                            className="p-1.5 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {/* Import button */}
                    <button
                        onClick={handleImport}
                        disabled={selectedCount === 0}
                        className="w-full h-14 flex items-center justify-center gap-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold text-base rounded-2xl shadow-lg shadow-brand-500/25 transition-colors"
                    >
                        <Sparkles size={18} />
                        Importer {selectedCount} plat{selectedCount > 1 ? "s" : ""} dans mon menu
                    </button>
                </div>
            )}

            {/* Step 3: Importing */}
            {step === "importing" && (
                <div className="text-center py-16">
                    <Loader2 size={48} className="mx-auto text-brand-500 animate-spin mb-4" />
                    <p className="text-lg font-bold text-surface-900 dark:text-white">
                        Import en cours...
                    </p>
                    <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                        {importProgress} / {importTotal} plats importés
                    </p>
                    <div className="w-64 mx-auto mt-4 h-2 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-brand-500 rounded-full transition-all duration-300"
                            style={{ width: `${importTotal > 0 ? (importProgress / importTotal) * 100 : 0}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Step 4: Done */}
            {step === "done" && (
                <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto rounded-full bg-green-500 flex items-center justify-center mb-4">
                        <Check size={36} className="text-white" />
                    </div>
                    <p className="text-2xl font-bold text-surface-900 dark:text-white">
                        Menu importé !
                    </p>
                    <p className="text-surface-500 dark:text-surface-400 mt-2">
                        {importProgress} plat{importProgress > 1 ? "s" : ""} ajouté{importProgress > 1 ? "s" : ""} à votre catalogue
                    </p>
                    <div className="flex items-center justify-center gap-3 mt-6">
                        <Link
                            href="/dashboard/menu"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-2xl transition-colors"
                        >
                            Voir mon menu
                        </Link>
                        <button
                            onClick={() => { setStep("upload"); setProducts([]); setImagePreview(null); }}
                            className="inline-flex items-center gap-2 px-6 py-3 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 font-semibold rounded-2xl hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                        >
                            <Camera size={16} />
                            Scanner un autre menu
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function MenuImportPage() {
    const { isPremium, loading } = usePremiumCheck();

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-surface-400" />
            </div>
        );
    }

    if (!isPremium) {
        return <PremiumUpgradeCard feature="OCR Menu" description="Scannez un menu papier et importez tous les plats automatiquement grace a l'IA." />;
    }

    return <MenuImportContent />;
}
