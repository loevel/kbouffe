"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, X, Star, Trash2, Zap, Lock, Link2 } from "lucide-react";
import { Card, Button, Input } from "@kbouffe/module-core/ui";
import { toast } from "@kbouffe/module-core/ui";
import { useLocale } from "@kbouffe/module-core/ui";
import { formatCFA } from "@kbouffe/module-core/ui";
import { useGallery } from "@/hooks/use-gallery";
import { useUploadImage } from "@/hooks/use-upload-image";

interface PhotoGridItemProps {
  id: string;
  photoUrl: string;
  altText: string;
  isFeatured: boolean;
  onDelete: () => void;
  onToggleFeatured: () => void;
  onUpdateAlt: (text: string) => void;
}

function PhotoGridItem({
  id,
  photoUrl,
  altText,
  isFeatured,
  onDelete,
  onToggleFeatured,
  onUpdateAlt,
}: PhotoGridItemProps) {
  const { t } = useLocale();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(altText);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveAlt = async () => {
    if (editText !== altText) {
      try {
        await onUpdateAlt(editText);
        setIsEditing(false);
      } catch (error) {
        toast.error("Erreur lors de la mise à jour");
      }
    } else {
      setIsEditing(false);
    }
  };

  return (
    <div className="relative group">
      <div className="aspect-square relative rounded-lg overflow-hidden bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt={altText || "Restaurant photo"}
          className="absolute inset-0 w-full h-full object-cover group-hover:opacity-75 transition-opacity"
        />
        {isFeatured && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-brand-500 text-white px-2 py-1 rounded text-xs font-medium">
            <Star size={12} fill="currentColor" />
            {(t.settings as any).galleryFeatured ?? "À la une"}
          </div>
        )}
      </div>

      {/* Hover actions */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={onToggleFeatured}
          className="p-2 bg-white text-surface-900 rounded-lg hover:bg-surface-100 transition-colors"
          title={isFeatured ? "Désélectionner comme photo à la une" : "Sélectionner comme photo à la une"}
        >
          <Star size={18} fill={isFeatured ? "currentColor" : "none"} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          className="p-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg transition-colors"
          title="Supprimer"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Alt text editor */}
      <div className="mt-2">
        {isEditing ? (
          <div className="flex gap-1">
            <Input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              placeholder={(t.settings as any).galleryAltLabel ?? "Texte alternatif"}
              className="text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveAlt();
                if (e.key === "Escape") setIsEditing(false);
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleSaveAlt}
              className="px-2"
            >
              ✓
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(false)}
              className="px-2"
            >
              ✕
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="w-full text-left text-xs text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200 truncate"
          >
            {altText || ((t.settings as any).galleryAltLabel ?? "Texte alternatif")}
          </button>
        )}
      </div>
    </div>
  );
}

interface GalleryPack {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  duration_days: number | null;
  features: string[];
  icon: string;
}

interface GalleryPackInfo {
  max_photos: number;
  is_pack_active: boolean;
  current_pack: GalleryPack | null;
  active_purchase: {
    id: string;
    status: string;
    expires_at: string | null;
  } | null;
}

export function GalleryForm() {
  const { t } = useLocale();
  const { gallery, photos, isLoading, addPhoto, deletePhoto, updatePhoto } = useGallery();
  const { upload, uploading: isUploading } = useUploadImage();
  const [isDragging, setIsDragging] = useState(false);
  const [packInfo, setPackInfo] = useState<GalleryPackInfo | null>(null);
  const [allPacks, setAllPacks] = useState<GalleryPack[]>([]);
  const [loadingPacks, setLoadingPacks] = useState(true);
  const [galleryUrlInput, setGalleryUrlInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchPacks() {
      try {
        const [packRes, allPacksRes] = await Promise.all([
          fetch("/api/gallery/pack"),
          fetch("/api/gallery/packs"),
        ]);

        if (packRes.ok) {
          const data = await packRes.json();
          setPackInfo(data.gallery);
        }

        if (allPacksRes.ok) {
          const data = await allPacksRes.json();
          setAllPacks(data.packs || []);
        }
      } catch (err) {
        console.error("Error fetching packs:", err);
      } finally {
        setLoadingPacks(false);
      }
    }

    fetchPacks();
  }, []);

  const quotaReached = gallery && photos.length >= gallery.max_photos;

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (quotaReached) {
        toast.error((t.settings as any).galleryQuotaReached ?? "Quota atteint. Contactez un admin pour augmenter la limite.");
        return;
      }

      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        await uploadAndAddPhoto(file);
      }
    },
    [quotaReached]
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAndAddPhoto(file);
    }
  };

  const uploadAndAddPhoto = async (file: File) => {
    try {
      const result = await upload(file);
      if (result?.url) {
        await addPhoto(result.url, file.name);
        toast.success("Photo ajoutée avec succès");
      }
    } catch (error) {
      toast.error("Erreur lors de l'ajout de la photo");
      console.error(error);
    }
  };

  const handleUrlSubmit = async () => {
    const trimmed = galleryUrlInput.trim();
    if (!trimmed) return;
    try {
      new URL(trimmed);
    } catch {
      toast.error("URL invalide");
      return;
    }
    try {
      await addPhoto(trimmed, "Photo URL");
      setGalleryUrlInput("");
      toast.success("Photo ajoutée avec succès");
    } catch (error) {
      toast.error("Erreur lors de l'ajout de la photo");
      console.error(error);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm((t.common as any).deleteConfirm ?? "Êtes-vous sûr ?")) return;

    try {
      await deletePhoto(photoId);
      toast.success("Photo supprimée");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    }
  };

  const handleToggleFeatured = async (photoId: string, currentFeatured: boolean) => {
    try {
      await updatePhoto(photoId, { is_featured: !currentFeatured });
      toast.success("Photo mise à jour");
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
      console.error(error);
    }
  };

  const handleUpdateAlt = async (photoId: string, altText: string) => {
    try {
      await updatePhoto(photoId, { alt_text: altText });
    } catch (error) {
      throw error;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-surface-200 dark:bg-surface-700 rounded w-48" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-surface-200 dark:bg-surface-700 rounded-lg"
              />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      {/* Pack Info Card */}
      {packInfo && !loadingPacks && (
        <Card className="mb-6 bg-gradient-to-r from-brand-50 to-brand-100/50 dark:from-brand-900/20 dark:to-brand-800/10 border-brand-200 dark:border-brand-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={18} className="text-brand-500" />
                <h3 className="font-semibold text-surface-900 dark:text-white">
                  {packInfo.current_pack?.name ?? "Galerie Basique (Par défaut)"}
                </h3>
                {packInfo.is_pack_active && (
                  <span className="px-2 py-1 text-xs font-bold bg-green-500 text-white rounded-full">
                    Actif
                  </span>
                )}
              </div>
              <p className="text-sm text-surface-600 dark:text-surface-400 mb-3">
                {packInfo.current_pack?.description ?? "Gérez jusqu'à 5 photos de votre restaurant avec une galerie interactive."}
              </p>
              <div className="text-sm font-medium text-surface-900 dark:text-white">
                Quota : {photos.length} / {packInfo.max_photos} photos
              </div>
              {packInfo.active_purchase?.expires_at && (
                <p className="text-xs text-surface-500 mt-1">
                  Expire le {new Date(packInfo.active_purchase.expires_at).toLocaleDateString("fr-FR")}
                </p>
              )}
            </div>

            {packInfo.current_pack && packInfo.current_pack.price > 0 && (
              <div className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-brand-600 hover:text-brand-700"
                >
                  Upgrade
                </Button>
              </div>
            )}
          </div>

          {/* Available packs comparison */}
          {allPacks.length > 0 && (
            <div className="mt-6 pt-6 border-t border-brand-200 dark:border-brand-800">
              <p className="text-xs font-semibold text-surface-600 dark:text-surface-400 mb-3 uppercase tracking-wider">
                Autres packs disponibles
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {allPacks.map((pack) => (
                  <div
                    key={pack.id}
                    className={`p-3 rounded-lg border transition-all ${
                      packInfo.current_pack?.id === pack.id
                        ? "border-brand-500 bg-brand-50 dark:bg-brand-900/30"
                        : "border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-surface-900 dark:text-white truncate">
                          {pack.name}
                        </p>
                        <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                          {pack.features[0]}
                        </p>
                      </div>
                      {pack.price > 0 && (
                        <div className="text-right ml-2">
                          <p className="text-sm font-bold text-surface-900 dark:text-white">
                            {formatCFA(pack.price)}
                          </p>
                          {pack.duration_days && (
                            <p className="text-xs text-surface-400">
                              /{pack.duration_days}j
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      <Card>
        <div className="mb-6">
          <h3 className="font-semibold text-surface-900 dark:text-white">
            {(t.settings as any).gallery ?? "Galerie de photos"}
          </h3>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {(t.settings as any).gallerySubtitle ?? "Gérez les photos de votre restaurant"}
          </p>
        </div>

        {/* Upload zone */}
        {!quotaReached && (
        <div
          className={`
            relative border-2 border-dashed rounded-xl transition-all p-6 mb-8
            ${
              isDragging
                ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                : "border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600"
            }
            ${isUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          `}
          onDragOver={(e) => {
            e.preventDefault();
            if (!isUploading) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !isUploading && inputRef.current?.click()}
        >
          <div className="flex flex-col items-center justify-center">
            {isUploading ? (
              <>
                <div className="animate-spin mb-2">
                  <Upload size={28} className="text-brand-500" />
                </div>
                <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                  Chargement...
                </p>
              </>
            ) : (
              <>
                <Upload size={28} className="text-surface-400 mb-2" />
                <p className="text-sm font-medium text-surface-900 dark:text-white">
                  Glissez une photo ou cliquez pour sélectionner
                </p>
                <p className="text-xs text-surface-500 mt-1">{(t.settings as any).galleryUploadHint ?? "JPEG, PNG ou WebP — max 5 Mo"}</p>
              </>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
        </div>
      )}

        {/* URL input */}
        {!quotaReached && (
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center gap-2 text-surface-400">
              <Link2 size={16} />
              <span className="text-xs font-medium whitespace-nowrap">ou via URL</span>
            </div>
            <div className="flex-1">
              <Input
                type="url"
                value={galleryUrlInput}
                onChange={(e) => setGalleryUrlInput(e.target.value)}
                placeholder="https://exemple.com/photo.jpg"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleUrlSubmit(); } }}
              />
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleUrlSubmit}
              disabled={!galleryUrlInput.trim()}
            >
              Ajouter
            </Button>
          </div>
        )}

        {/* Quota reached message */}
        {quotaReached && (
          <div className="mb-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {(t.settings as any).galleryQuotaReached ?? "Quota atteint. Contactez un admin pour augmenter la limite."}
            </p>
          </div>
        )}

        {/* Photos grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-surface-900 dark:text-white">
              {photos.length} / {gallery?.max_photos ?? 5} {(t.settings as any).galleryCount ?? "photos"}
            </h4>
          </div>

          {photos.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-surface-500 dark:text-surface-400">
                {(t.settings as any).galleryEmpty ?? "Aucune photo. Ajoutez votre première photo !"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {photos.map((photo) => (
                <PhotoGridItem
                  key={photo.id}
                  id={photo.id}
                  photoUrl={photo.photo_url}
                  altText={photo.alt_text}
                  isFeatured={photo.is_featured}
                  onDelete={() => handleDeletePhoto(photo.id)}
                  onToggleFeatured={() => handleToggleFeatured(photo.id, photo.is_featured)}
                  onUpdateAlt={(text) => handleUpdateAlt(photo.id, text)}
                />
              ))}
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
