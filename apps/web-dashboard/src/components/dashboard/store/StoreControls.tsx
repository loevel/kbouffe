"use client";

import { useMemo, useState } from "react";
import { Link as LinkIcon, Save, Globe, Loader2 } from "lucide-react";
import { Card, Button, Input, Toggle, toast } from "@kbouffe/module-core/ui";
import { useDashboard } from "@kbouffe/module-core/ui";
import { useLocale } from "@kbouffe/module-core/ui";
import { EditStoreProfileModal } from "./EditStoreProfileModal";

function slugify(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

export function StoreControls() {
    const { restaurant, loading, updateRestaurant } = useDashboard();
    const { t } = useLocale();
    const [slugDraft, setSlugDraft] = useState(restaurant?.slug ?? "");
    const [savingSlug, setSavingSlug] = useState(false);
    const [savingPublish, setSavingPublish] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const storeUrl = useMemo(() => `/r/${restaurant?.slug ?? ""}`, [restaurant?.slug]);

    if (loading || !restaurant) {
        return (
            <Card>
                <div className="space-y-3 animate-pulse">
                    <div className="h-6 rounded bg-surface-200 dark:bg-surface-700 w-40" />
                    <div className="h-10 rounded bg-surface-200 dark:bg-surface-700" />
                    <div className="h-10 rounded bg-surface-200 dark:bg-surface-700" />
                </div>
            </Card>
        );
    }

    const normalizedSlug = slugify(slugDraft);
    const hasSlugChanges = normalizedSlug !== restaurant.slug;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(storeUrl);
            toast.success(t.store.linkCopied);
        } catch {
            toast.error(t.store.copyFailed);
        }
    };

    const handleTogglePublish = async (checked: boolean) => {
        setSavingPublish(true);
        const { error } = await updateRestaurant({ is_published: checked });
        setSavingPublish(false);

        if (error) {
            toast.error(error);
            return;
        }

        toast.success(checked ? t.store.publishedSuccess : t.store.unpublishedSuccess);
    };

    const handleSaveSlug = async () => {
        if (!normalizedSlug) {
            toast.error(t.store.slugRequired);
            return;
        }

        setSavingSlug(true);
        const { error } = await updateRestaurant({ slug: normalizedSlug });
        setSavingSlug(false);

        if (error) {
            toast.error(error);
            return;
        }

        setSlugDraft(normalizedSlug);
        toast.success(t.store.slugSaved);
    };

    return (
        <Card>
            <h3 className="font-semibold text-surface-900 dark:text-white mb-4">{t.store.controlsTitle}</h3>

            <div className="space-y-5">
                <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-surface-50 dark:bg-surface-800">
                    <div>
                        <p className="text-sm font-medium text-surface-900 dark:text-white">{t.store.publishLabel}</p>
                        <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">{t.store.publishHint}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {savingPublish && <Loader2 size={16} className="animate-spin text-surface-500" />}
                        <Toggle checked={restaurant.is_published} onChange={handleTogglePublish} disabled={savingPublish} />
                    </div>
                </div>

                <div className="space-y-2">
                    <Input
                        label={t.store.slugLabel}
                        value={slugDraft}
                        onChange={(e) => setSlugDraft(e.target.value)}
                        placeholder="mon-restaurant"
                        leftIcon={<LinkIcon size={16} />}
                    />
                    <p className="text-xs text-surface-500 dark:text-surface-400">
                        {t.store.slugPreview} <span className="font-medium">https://kbouffe.com/{normalizedSlug || "..."}</span>
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Save size={14} />}
                            onClick={handleSaveSlug}
                            isLoading={savingSlug}
                            disabled={!hasSlugChanges || !normalizedSlug}
                        >
                            {t.store.saveSlug}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSlugDraft(restaurant.slug)}
                            disabled={!hasSlugChanges}
                        >
                            {t.store.resetSlug}
                        </Button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-surface-100 dark:border-surface-800">
                    <Button variant="outline" size="sm" leftIcon={<LinkIcon size={14} />} onClick={handleCopy}>
                        {t.store.copyLink}
                    </Button>
                    <a href={storeUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" leftIcon={<Globe size={14} />}>
                            {t.store.openStore}
                        </Button>
                    </a>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        leftIcon={<Save size={14} />} 
                        onClick={() => setIsEditModalOpen(true)}
                    >
                        Modifier le profil
                    </Button>
                </div>
            </div>

            <EditStoreProfileModal 
                isOpen={isEditModalOpen} 
                onClose={() => setIsEditModalOpen(false)} 
            />
        </Card>
    );
}
