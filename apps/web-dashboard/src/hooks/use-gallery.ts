"use client";

import useSWR, { SWRConfiguration } from "swr";
import { authFetch } from "@kbouffe/module-core/ui";

export interface GalleryPhoto {
  id: string;
  photo_url: string;
  alt_text: string;
  display_order: number;
  is_featured: boolean;
}

export interface GalleryConfig {
  max_photos: number;
}

export interface GalleryData {
  gallery: GalleryConfig;
  photos: GalleryPhoto[];
}

async function galleryFetcher(url: string): Promise<GalleryData> {
  const res = await authFetch(url);
  if (!res.ok) throw new Error("Failed to fetch gallery");
  return res.json();
}

export function useGallery(options?: SWRConfiguration) {
  const { data, isLoading, error, mutate } = useSWR<GalleryData>(
    "/api/gallery",
    galleryFetcher,
    {
      revalidateOnFocus: false,
      ...options,
    }
  );

  async function addPhoto(
    photoUrl: string,
    altText: string = ""
  ): Promise<GalleryPhoto | null> {
    try {
      const res = await authFetch("/api/gallery/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo_url: photoUrl, alt_text: altText }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erreur lors de l'ajout");
      }

      const photo = await res.json();

      // Revalidate gallery data
      mutate();

      return photo;
    } catch (err) {
      console.error("Error adding photo:", err);
      throw err;
    }
  }

  async function deletePhoto(photoId: string): Promise<void> {
    try {
      const res = await authFetch(`/api/gallery/photos/${photoId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erreur lors de la suppression");
      }

      // Revalidate gallery data
      mutate();
    } catch (err) {
      console.error("Error deleting photo:", err);
      throw err;
    }
  }

  async function updatePhoto(
    photoId: string,
    updates: Partial<Pick<GalleryPhoto, "alt_text" | "display_order" | "is_featured">>
  ): Promise<GalleryPhoto | null> {
    try {
      const res = await authFetch(`/api/gallery/photos/${photoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erreur lors de la mise à jour");
      }

      const photo = await res.json();

      // Revalidate gallery data
      mutate();

      return photo;
    } catch (err) {
      console.error("Error updating photo:", err);
      throw err;
    }
  }

  return {
    gallery: data?.gallery,
    photos: data?.photos || [],
    isLoading,
    error,
    addPhoto,
    deletePhoto,
    updatePhoto,
    mutate,
  };
}
