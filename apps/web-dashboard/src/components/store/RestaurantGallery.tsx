"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";

interface Photo {
  id: string;
  photo_url: string;
  alt_text: string;
  display_order: number;
  is_featured: boolean;
}

interface RestaurantGalleryProps {
  restaurantId: string;
}

export function RestaurantGallery({ restaurantId }: RestaurantGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    async function fetchPhotos() {
      try {
        const supabase = await createClient();
        const { data, error } = await (supabase as any)
          .from("restaurant_photos")
          .select("id, photo_url, alt_text, display_order, is_featured")
          .eq("restaurant_id", restaurantId)
          .order("is_featured", { ascending: false })
          .order("display_order", { ascending: true });

        if (error) {
          console.error("Error fetching photos:", error);
          return;
        }

        setPhotos(data || []);
      } catch (error) {
        console.error("Error fetching gallery:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPhotos();
  }, [restaurantId]);

  if (isLoading || photos.length === 0) {
    return null;
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const currentPhoto = photos[currentIndex];

  return (
    <>
      {/* Gallery Grid */}
      <section className="py-8">
        <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-6">
          Galerie
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              onClick={() => {
                setCurrentIndex(index);
                setLightboxOpen(true);
              }}
              className="relative aspect-square group overflow-hidden rounded-lg"
            >
              <Image
                src={photo.photo_url}
                alt={photo.alt_text || "Restaurant photo"}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {photo.is_featured && (
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Lightbox */}
      {lightboxOpen && currentPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <div
            className="relative w-full h-full max-w-4xl max-h-[90vh] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors z-10"
            >
              <X size={24} />
            </button>

            {/* Main image */}
            <div className="relative w-full h-full">
              <Image
                src={currentPhoto.photo_url}
                alt={currentPhoto.alt_text || "Restaurant photo"}
                fill
                className="object-contain"
              />
            </div>

            {/* Navigation buttons */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors z-10"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors z-10"
                >
                  <ChevronRight size={24} />
                </button>

                {/* Photo counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur px-4 py-2 rounded-lg text-white text-sm">
                  {currentIndex + 1} / {photos.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
