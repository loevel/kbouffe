"use client";

import { useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Sparkles,
    Loader2,
    Download,
    Copy,
    RefreshCw,
    Check,
    ImagePlus,
    Palette,
    Save,
} from "lucide-react";
import { Card, Button, Input, toast, authFetch } from "@kbouffe/module-core/ui";
import { useProducts } from "@/hooks/use-data";
import { usePremiumCheck } from "@/hooks/use-premium";
import { PremiumUpgradeCard } from "@/components/dashboard/PremiumUpgradeCard";

const STYLES = [
    { id: "rustic", label: "Rustique", desc: "Table en bois, lumiere chaude, ambiance cozy", emoji: "🪵" },
    { id: "modern", label: "Moderne", desc: "Assiette blanche, presentation minimaliste", emoji: "🍽️" },
    { id: "vibrant", label: "Vibrant", desc: "Couleurs vives, ingredients frais visibles", emoji: "🌈" },
    { id: "street", label: "Street Food", desc: "Style marche, preparation authentique", emoji: "🏪" },
];

type GeneratedPhoto = {
    id: string;
    productName: string;
    style: string;
    imageUrl: string;
    prompt: string;
    timestamp: number;
};

function PhotoStudioContent() {
    const { products } = useProducts();

    // Form state
    const [productName, setProductName] = useState("");
    const [selectedStyle, setSelectedStyle] = useState("rustic");
    const [selectedProductId, setSelectedProductId] = useState("");
    const [generating, setGenerating] = useState(false);

    // Results
    const [photos, setPhotos] = useState<GeneratedPhoto[]>([]);
    const [savingId, setSavingId] = useState<string | null>(null);

    // Sync product name when product selected
    const handleProductSelect = (productId: string) => {
        setSelectedProductId(productId);
        if (productId) {
            const p = products.find((pr: any) => pr.id === productId) as any;
            if (p) setProductName(p.name);
        }
    };

    // Generate photo
    const handleGenerate = async () => {
        const name = productName.trim();
        if (!name) {
            toast.error("Entrez le nom du plat");
            return;
        }

        setGenerating(true);
        try {
            const res = await fetch("/api/ai/enhance-photo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: "generate",
                    productName: name,
                    style: selectedStyle,
                }),
            });
            const data = await res.json();

            if (data.imageUrl) {
                const newPhoto: GeneratedPhoto = {
                    id: `photo_${Date.now()}`,
                    productName: name,
                    style: selectedStyle,
                    imageUrl: data.imageUrl,
                    prompt: data.prompt ?? "",
                    timestamp: Date.now(),
                };
                setPhotos(prev => [newPhoto, ...prev]);
                toast.success("Photo generee !");
            } else if (data.fallback && data.prompt) {
                toast.error("Generation indisponible. Le prompt a ete copie.");
                navigator.clipboard?.writeText(data.prompt);
            } else {
                toast.error(data.error ?? "Erreur de generation");
            }
        } catch {
            toast.error("Erreur de connexion au service IA");
        } finally {
            setGenerating(false);
        }
    };

    // Save generated image as product image
    const handleSaveToProduct = async (photo: GeneratedPhoto) => {
        if (!selectedProductId) {
            toast.error("Selectionnez d'abord un produit dans la liste");
            return;
        }

        setSavingId(photo.id);
        try {
            // Convert base64 to blob and upload
            const base64Data = photo.imageUrl.replace(/^data:image\/\w+;base64,/, "");
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: "image/png" });
            const file = new File([blob], `ai-photo-${Date.now()}.png`, { type: "image/png" });

            // Upload to Supabase Storage via existing upload endpoint
            const formData = new FormData();
            formData.append("file", file);
            const uploadRes = await authFetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            const uploadData = await uploadRes.json() as any;

            if (!uploadData.url) {
                toast.error("Erreur d'upload de l'image");
                return;
            }

            // Update product image_url
            const updateRes = await authFetch(`/api/products/${selectedProductId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image_url: uploadData.url }),
            });
            const updateData = await updateRes.json() as any;

            if (updateData.error) {
                toast.error(updateData.error);
            } else {
                toast.success("Photo sauvegardee sur le produit !");
            }
        } catch (err) {
            toast.error("Erreur lors de la sauvegarde");
        } finally {
            setSavingId(null);
        }
    };

    // Download image
    const handleDownload = (photo: GeneratedPhoto) => {
        const link = document.createElement("a");
        link.href = photo.imageUrl;
        link.download = `${photo.productName.replace(/\s+/g, "-")}-${photo.style}.png`;
        link.click();
    };

    // Copy prompt
    const handleCopyPrompt = (prompt: string) => {
        navigator.clipboard?.writeText(prompt);
        toast.success("Prompt copie !");
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/menu" className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
                            <Sparkles size={20} className="text-white" />
                        </div>
                        Studio Photo IA
                    </h1>
                    <p className="text-surface-500 dark:text-surface-400 mt-1">
                        Generez des photos professionnelles de vos plats avec Gemini Imagen
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Generator */}
                <div className="space-y-4">
                    {/* Product picker */}
                    <Card>
                        <h3 className="font-semibold text-surface-900 dark:text-white mb-3">Plat a photographier</h3>
                        <div className="space-y-3">
                            <select
                                value={selectedProductId}
                                onChange={(e) => handleProductSelect(e.target.value)}
                                className="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2.5 text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">-- Choisir un produit existant --</option>
                                {products.map((p: any) => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.price} FCFA)</option>
                                ))}
                            </select>

                            <div className="relative">
                                <div className="absolute inset-x-0 top-1/2 border-t border-surface-200 dark:border-surface-700" />
                                <p className="relative text-center">
                                    <span className="bg-white dark:bg-surface-900 px-3 text-xs text-surface-400">ou saisie libre</span>
                                </p>
                            </div>

                            <Input
                                placeholder="Ex: Ndole aux crevettes"
                                value={productName}
                                onChange={(e) => setProductName(e.target.value)}
                            />
                        </div>
                    </Card>

                    {/* Style picker */}
                    <Card>
                        <h3 className="font-semibold text-surface-900 dark:text-white mb-3 flex items-center gap-2">
                            <Palette size={16} /> Style visuel
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {STYLES.map(style => (
                                <button
                                    key={style.id}
                                    type="button"
                                    onClick={() => setSelectedStyle(style.id)}
                                    className={`p-3 rounded-xl text-left transition-all border-2 ${
                                        selectedStyle === style.id
                                            ? "border-purple-500 bg-purple-50 dark:bg-purple-500/10"
                                            : "border-surface-200 dark:border-surface-700 hover:border-surface-300"
                                    }`}
                                >
                                    <span className="text-lg">{style.emoji}</span>
                                    <p className="text-sm font-semibold text-surface-900 dark:text-white mt-1">{style.label}</p>
                                    <p className="text-[10px] text-surface-400 mt-0.5 line-clamp-2">{style.desc}</p>
                                </button>
                            ))}
                        </div>
                    </Card>

                    {/* Generate button */}
                    <Button
                        onClick={handleGenerate}
                        isLoading={generating}
                        leftIcon={<Sparkles size={16} />}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                        disabled={!productName.trim()}
                    >
                        {generating ? "Generation en cours..." : "Generer la photo"}
                    </Button>

                    {generating && (
                        <p className="text-xs text-center text-surface-400 animate-pulse">
                            Imagen 3 travaille... cela peut prendre 10-20 secondes
                        </p>
                    )}
                </div>

                {/* Right: Results gallery */}
                <div className="lg:col-span-2">
                    {photos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center mb-4">
                                <ImagePlus size={36} className="text-purple-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
                                Votre studio photo IA
                            </h3>
                            <p className="text-sm text-surface-400 max-w-sm">
                                Selectionnez un plat et un style, puis cliquez sur "Generer" pour creer
                                une photo professionnelle avec l'intelligence artificielle.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-surface-900 dark:text-white">
                                    Photos generees ({photos.length})
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {photos.map(photo => (
                                    <Card key={photo.id} className="overflow-hidden">
                                        {/* Image */}
                                        <div className="relative aspect-square -mx-4 -mt-4 sm:-mx-5 sm:-mt-5 mb-4">
                                            <img
                                                src={photo.imageUrl}
                                                alt={photo.productName}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute top-3 left-3">
                                                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-black/50 text-white backdrop-blur-sm">
                                                    {STYLES.find(s => s.id === photo.style)?.emoji} {STYLES.find(s => s.id === photo.style)?.label}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <h4 className="font-semibold text-surface-900 dark:text-white text-sm mb-2">
                                            {photo.productName}
                                        </h4>

                                        {/* Actions */}
                                        <div className="flex flex-wrap gap-2">
                                            {selectedProductId && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleSaveToProduct(photo)}
                                                    disabled={savingId === photo.id}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    {savingId === photo.id ? (
                                                        <Loader2 size={12} className="animate-spin" />
                                                    ) : (
                                                        <Save size={12} />
                                                    )}
                                                    Appliquer au produit
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => handleDownload(photo)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-surface-600 dark:text-surface-400 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 rounded-lg transition-colors"
                                            >
                                                <Download size={12} /> Telecharger
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleCopyPrompt(photo.prompt)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-surface-600 dark:text-surface-400 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 rounded-lg transition-colors"
                                            >
                                                <Copy size={12} /> Prompt
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setProductName(photo.productName);
                                                    setSelectedStyle(photo.style);
                                                    handleGenerate();
                                                }}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-surface-600 dark:text-surface-400 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 rounded-lg transition-colors"
                                            >
                                                <RefreshCw size={12} /> Variante
                                            </button>
                                        </div>

                                        {/* Prompt preview */}
                                        <details className="mt-3">
                                            <summary className="text-[10px] text-surface-400 cursor-pointer hover:text-surface-600">
                                                Voir le prompt utilise
                                            </summary>
                                            <p className="mt-1 text-[10px] text-surface-400 bg-surface-50 dark:bg-surface-800/50 p-2 rounded-lg">
                                                {photo.prompt}
                                            </p>
                                        </details>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function PhotoStudioPage() {
    const { isPremium, loading } = usePremiumCheck();

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-surface-400" />
            </div>
        );
    }

    if (!isPremium) {
        return <PremiumUpgradeCard feature="Photo IA" description="Generez des photos professionnelles de vos plats grace a l'IA Gemini Imagen." />;
    }

    return <PhotoStudioContent />;
}
