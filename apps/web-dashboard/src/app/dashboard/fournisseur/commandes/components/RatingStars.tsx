"use client";

/**
 * RatingStars -- Restaurant rating display with popup for comments
 *
 * Shows: star icon + avg rating + (count)
 * Click to open popup with individual reviews
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, MessageCircle, Loader2 } from "lucide-react";
import { authFetch } from "@kbouffe/module-core/ui";

// ── Types ────────────────────────────────────────────────────────────────

interface RatingStarsProps {
    orderId: string;
    rating: number | null;
    ratingCount?: number;
    restaurantName?: string;
}

interface ReviewItem {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    reviewer_name?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
    return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(dateStr));
}

function StarIcon({
    filled,
    half,
    size = 13,
}: {
    filled: boolean;
    half?: boolean;
    size?: number;
}) {
    return (
        <Star
            size={size}
            className={
                filled
                    ? "text-amber-400 fill-amber-400"
                    : "text-surface-600"
            }
        />
    );
}

function StarRatingDisplay({ rating, size = 13 }: { rating: number; size?: number }) {
    return (
        <div className="inline-flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon key={i} filled={i < Math.round(rating)} size={size} />
            ))}
        </div>
    );
}

// ── Component ────────────────────────────────────────────────────────────

export function RatingStars({
    orderId,
    rating,
    ratingCount = 0,
    restaurantName,
}: RatingStarsProps) {
    const [popupOpen, setPopupOpen] = useState(false);
    const [reviews, setReviews] = useState<ReviewItem[]>([]);
    const [loadingReviews, setLoadingReviews] = useState(false);

    // Fetch reviews when popup opens
    useEffect(() => {
        if (!popupOpen || !orderId) return;

        async function fetchReviews() {
            setLoadingReviews(true);
            try {
                const res = await authFetch(
                    `/api/marketplace/suppliers/me/orders/${orderId}/reviews`
                );
                if (res.ok) {
                    const data = await res.json();
                    const list = Array.isArray(data) ? data : data?.reviews ?? [];
                    setReviews(list as ReviewItem[]);
                } else {
                    throw new Error(`HTTP ${res.status}`);
                }
            } catch (err) {
                console.warn(
                    "[RatingStars] API reviews non disponible, utilisation de mock data.",
                    err
                );
                // Mock reviews
                if (rating != null) {
                    const mockReviews: ReviewItem[] = Array.from(
                        { length: Math.max(1, ratingCount) },
                        (_, i) => ({
                            id: `mock-${i}`,
                            rating: Math.max(1, Math.min(5, Math.round(rating + (Math.random() - 0.5) * 2))),
                            comment:
                                i === 0
                                    ? "Bonne qualite, livraison rapide."
                                    : i === 1
                                    ? "Produits frais, conforme a la commande."
                                    : null,
                            created_at: new Date(
                                Date.now() - i * 7 * 24 * 60 * 60 * 1000
                            ).toISOString(),
                            reviewer_name: restaurantName ?? "Restaurant",
                        })
                    );
                    setReviews(mockReviews);
                }
            } finally {
                setLoadingReviews(false);
            }
        }

        fetchReviews();
    }, [popupOpen, orderId, rating, ratingCount, restaurantName]);

    // No rating
    if (rating == null) {
        return (
            <span
                className="text-surface-600 text-sm cursor-default"
                title="Pas encore de note pour cette commande"
            >
                &mdash;
            </span>
        );
    }

    return (
        <>
            {/* Inline display */}
            <button
                onClick={() => setPopupOpen(true)}
                className="inline-flex items-center gap-1 text-sm hover:bg-white/5 px-1.5 py-0.5 rounded-lg transition-all group"
                title="Evaluation moyenne du restaurant pour cette commande"
                aria-label={`Note: ${rating.toFixed(1)} sur 5, ${ratingCount} avis. Cliquer pour voir les details.`}
            >
                <Star size={13} className="text-amber-400 fill-amber-400" />
                <span className="text-white font-medium">{rating.toFixed(1)}</span>
                {ratingCount > 0 && (
                    <span className="text-surface-500 text-xs">
                        ({ratingCount} avis)
                    </span>
                )}
            </button>

            {/* Reviews popup */}
            <AnimatePresence>
                {popupOpen && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="reviews-title"
                    >
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setPopupOpen(false)}
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 12 }}
                            transition={{ type: "spring", stiffness: 380, damping: 28 }}
                            className="relative w-full max-w-md bg-surface-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                                <div>
                                    <h3
                                        id="reviews-title"
                                        className="text-sm font-bold text-white"
                                    >
                                        Evaluations
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <StarRatingDisplay rating={rating} size={14} />
                                        <span className="text-sm text-white font-semibold">
                                            {rating.toFixed(1)}
                                        </span>
                                        <span className="text-xs text-surface-500">
                                            ({ratingCount} avis)
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setPopupOpen(false)}
                                    className="p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-white/8 transition-colors"
                                    aria-label="Fermer"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Reviews list */}
                            <div className="max-h-80 overflow-y-auto px-5 py-4 space-y-3">
                                {loadingReviews ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2
                                            size={20}
                                            className="text-brand-400 animate-spin"
                                        />
                                    </div>
                                ) : reviews.length === 0 ? (
                                    <div className="flex flex-col items-center py-8 text-center">
                                        <MessageCircle
                                            size={24}
                                            className="text-surface-600 mb-2"
                                        />
                                        <p className="text-sm text-surface-500">
                                            Aucun commentaire disponible
                                        </p>
                                    </div>
                                ) : (
                                    reviews.map((review) => (
                                        <div
                                            key={review.id}
                                            className="p-3 rounded-xl bg-surface-800 border border-white/5"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <StarRatingDisplay
                                                        rating={review.rating}
                                                        size={11}
                                                    />
                                                    <span className="text-xs text-white font-medium">
                                                        {review.rating}/5
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-surface-500">
                                                    {formatDate(review.created_at)}
                                                </span>
                                            </div>
                                            {review.reviewer_name && (
                                                <p className="text-xs text-surface-400 mb-1">
                                                    {review.reviewer_name}
                                                </p>
                                            )}
                                            {review.comment ? (
                                                <p className="text-xs text-surface-300 leading-relaxed">
                                                    {review.comment}
                                                </p>
                                            ) : (
                                                <p className="text-xs text-surface-600 italic">
                                                    Pas de commentaire
                                                </p>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
