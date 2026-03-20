"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Save, Upload, X, Image as ImageIcon, Palette } from "lucide-react";
import { Card, Button, Input } from "@kbouffe/module-core/ui";
import { toast } from "@kbouffe/module-core/ui";
import { useDashboard } from "@kbouffe/module-core/ui";
import { useLocale } from "@kbouffe/module-core/ui";
import { useUploadImage } from "@/hooks/use-upload-image";
import Image from "next/image";

interface ImageUploadProps {
    label: string;
    hint: string;
    currentImage: string | null;
    aspectRatio: "square" | "wide";
    onUpload: (file: File) => Promise<void>;
    onRemove: () => void;
}

function ImageUpload({ label, hint, currentImage, aspectRatio, onUpload, onRemove }: ImageUploadProps) {
    const { t } = useLocale();
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
            setIsUploading(true);
            try {
                await onUpload(file);
            } finally {
                setIsUploading(false);
            }
        }
    }, [onUpload]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploading(true);
            try {
                await onUpload(file);
            } finally {
                setIsUploading(false);
            }
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                {label}
            </label>
            <div
                className={`
                    relative border-2 border-dashed rounded-xl transition-all cursor-pointer
                    ${isDragging
                        ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                        : "border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600"
                    }
                    ${aspectRatio === "wide" ? "aspect-[3/1]" : "aspect-square max-w-[200px]"}
                `}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
            >
                {currentImage ? (
                    <>
                        <Image
                            src={currentImage}
                            alt={label}
                            fill
                            className="object-cover rounded-xl"
                        />
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onRemove(); }}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                        {isUploading ? (
                            <div className="animate-pulse">
                                <Upload size={32} className="text-surface-400 mb-2" />
                                <p className="text-sm text-surface-500">Chargement...</p>
                            </div>
                        ) : (
                            <>
                                <ImageIcon size={32} className="text-surface-400 mb-2" />
                                <p className="text-sm text-surface-500">{t.settings.dragOrClick}</p>
                            </>
                        )}
                    </div>
                )}
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </div>
            <p className="mt-1.5 text-xs text-surface-400">{hint}</p>
        </div>
    );
}

export function BrandingForm() {
    const { restaurant, updateRestaurant, loading: dashboardLoading } = useDashboard();
    const { t } = useLocale();
    const { upload } = useUploadImage();
    const [logo, setLogo] = useState<string | null>(null);
    const [cover, setCover] = useState<string | null>(null);
    const [primaryColor, setPrimaryColor] = useState<string>("#f97316");
    const [loading, setLoading] = useState(false);

    // Synchroniser avec les données du restaurant
    useEffect(() => {
        if (restaurant) {
            setLogo(restaurant.logo_url ?? null);
            setCover(restaurant.banner_url ?? null);
            setPrimaryColor(restaurant.primary_color ?? "#f97316");
        }
    }, [restaurant]);

    const uploadImage = async (file: File, type: "logo" | "cover"): Promise<string | null> => {
        try {
            const data = await upload(file);
            return data?.url ?? null;
        } catch (error) {
            console.error(`Upload ${type} error:`, error);
            toast.error("Erreur lors du téléchargement");
            return null;
        }
    };

    const handleLogoUpload = async (file: File) => {
        const url = await uploadImage(file, "logo");
        if (url) {
            setLogo(url);
        }
    };

    const handleCoverUpload = async (file: File) => {
        const url = await uploadImage(file, "cover");
        if (url) {
            setCover(url);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await updateRestaurant({
            logo_url: logo,
            banner_url: cover,
            primary_color: primaryColor,
        });

        if (error) {
            toast.error(`${t.settings.errorPrefix}${error}`);
        } else {
            toast.success(t.settings.brandingUpdated);
        }
        setLoading(false);
    };

    if (dashboardLoading) {
        return (
            <Card>
                <div className="animate-pulse space-y-4">
                    <div className="h-5 bg-surface-200 dark:bg-surface-700 rounded w-48" />
                    <div className="flex gap-6">
                        <div className="w-[200px] aspect-square bg-surface-200 dark:bg-surface-700 rounded-xl" />
                        <div className="flex-1 aspect-[3/1] bg-surface-200 dark:bg-surface-700 rounded-xl" />
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <h3 className="font-semibold text-surface-900 dark:text-white mb-4">
                    {t.settings.branding}
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">
                    <ImageUpload
                        label={t.settings.logo}
                        hint={t.settings.logoHint}
                        currentImage={logo}
                        aspectRatio="square"
                        onUpload={handleLogoUpload}
                        onRemove={() => setLogo(null)}
                    />
                    <ImageUpload
                        label={t.settings.coverImage}
                        hint={t.settings.coverHint}
                        currentImage={cover}
                        aspectRatio="wide"
                        onUpload={handleCoverUpload}
                        onRemove={() => setCover(null)}
                    />
                </div>

                {/* Primary Color Picker */}
                <div className="mt-8 pt-6 border-t border-surface-200 dark:border-surface-700">
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <Palette size={18} className="text-brand-500 mt-0.5" />
                            <div className="flex-1">
                                <label className="text-sm font-semibold text-surface-900 dark:text-white">
                                    {t.settings.primaryColor ?? "Couleur primaire"}
                                </label>
                                <p className="text-xs text-surface-500 mt-1">
                                    {t.settings.primaryColorDesc ?? "Couleur utilisée pour les boutons et accents"}
                                </p>
                                <div className="flex items-center gap-3 mt-4">
                                    <input
                                        type="color"
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                        className="h-12 w-24 rounded-lg cursor-pointer border border-surface-200 dark:border-surface-700"
                                    />
                                    <Input
                                        type="text"
                                        value={primaryColor}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            // Valider format hex
                                            if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                                                setPrimaryColor(val);
                                            } else if (val.length <= 7) {
                                                // Allow typing
                                                setPrimaryColor(val);
                                            }
                                        }}
                                        placeholder="#f97316"
                                        maxLength={7}
                                        className="w-32"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setPrimaryColor("#f97316")}
                                        className="text-xs"
                                    >
                                        {t.common.reset ?? "Réinitialiser"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <Button type="submit" leftIcon={<Save size={18} />} isLoading={loading}>
                        {t.common.save}
                    </Button>
                </div>
            </Card>
        </form>
    );
}
