"use client";

import { useState, useMemo } from "react";
import { Star, MessageSquare, Send, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, EmptyState, formatDate } from "@kbouffe/module-core/ui";
import {
    useMerchantProductReviews,
    useMerchantReviews,
    type MerchantProductReview,
    type MerchantReview,
} from "./useReviews";

function StarDisplay({ rating, size = 14 }: { rating: number; size?: number }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
                <Star
                    key={i}
                    size={size}
                    className={i <= rating ? "text-amber-500 fill-amber-500" : "text-surface-200 dark:text-surface-700"}
                />
            ))}
        </div>
    );
}

function ReviewCard({ review, onRespond }: { review: MerchantReview; onRespond: (id: string, response: string) => Promise<void> }) {
    const [showReply, setShowReply] = useState(false);
    const [replyText, setReplyText] = useState(review.response ?? "");
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        if (!replyText.trim()) return;
        setSending(true);
        try {
            await onRespond(review.id, replyText.trim());
            setShowReply(false);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-100 dark:border-surface-800 p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 text-sm font-bold shrink-0">
                        {review.customerName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-semibold text-surface-900 dark:text-white text-sm">{review.customerName}</p>
                        <p className="text-xs text-surface-400 mt-0.5">{formatDate(review.created_at)}</p>
                    </div>
                </div>
                <StarDisplay rating={review.rating} />
            </div>

            {review.comment && (
                <p className="mt-3 text-sm text-surface-700 dark:text-surface-300 leading-relaxed">{review.comment}</p>
            )}

            {review.response && !showReply && (
                <div className="mt-3 pl-3 border-l-2 border-brand-500 bg-surface-50 dark:bg-surface-800/50 rounded-r-lg p-3">
                    <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 mb-1">Votre réponse</p>
                    <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">{review.response}</p>
                </div>
            )}

            <div className="mt-3 flex items-center gap-2">
                <button
                    onClick={() => setShowReply(!showReply)}
                    className="flex items-center gap-1.5 text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
                >
                    <MessageSquare size={14} />
                    {review.response ? "Modifier la réponse" : "Répondre"}
                </button>
            </div>

            {showReply && (
                <div className="mt-3 flex gap-2">
                    <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Rédigez votre réponse..."
                        className="flex-1 min-h-[80px] rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                    />
                    <button
                        onClick={handleSend}
                        disabled={sending || !replyText.trim()}
                        className="self-end p-2.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}

function ProductReviewCard({ review, onRespond }: { review: MerchantProductReview; onRespond: (id: string, response: string) => Promise<void> }) {
    const [showReply, setShowReply] = useState(false);
    const [replyText, setReplyText] = useState(review.response ?? "");
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        if (!replyText.trim()) return;
        setSending(true);
        try {
            await onRespond(review.id, replyText.trim());
            setShowReply(false);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-100 dark:border-surface-800 p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 text-sm font-bold shrink-0">
                        {review.customerName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-semibold text-surface-900 dark:text-white text-sm">{review.customerName}</p>
                        <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Produit: <span className="font-medium">{review.productName}</span></p>
                        <p className="text-xs text-surface-400 mt-0.5">{formatDate(review.created_at)}</p>
                    </div>
                </div>
                <StarDisplay rating={review.rating} />
            </div>

            {review.comment && (
                <p className="mt-3 text-sm text-surface-700 dark:text-surface-300 leading-relaxed">{review.comment}</p>
            )}

            {review.response && !showReply && (
                <div className="mt-3 pl-3 border-l-2 border-brand-500 bg-surface-50 dark:bg-surface-800/50 rounded-r-lg p-3">
                    <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 mb-1">Votre réponse</p>
                    <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">{review.response}</p>
                </div>
            )}

            <div className="mt-3 flex items-center gap-2">
                <button
                    onClick={() => setShowReply(!showReply)}
                    className="flex items-center gap-1.5 text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
                >
                    <MessageSquare size={14} />
                    {review.response ? "Modifier la réponse" : "Répondre"}
                </button>
            </div>

            {showReply && (
                <div className="mt-3 flex gap-2">
                    <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Rédigez votre réponse..."
                        className="flex-1 min-h-[80px] rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                    />
                    <button
                        onClick={handleSend}
                        disabled={sending || !replyText.trim()}
                        className="self-end p-2.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}

export function MerchantReviewsPage() {
    const [tab, setTab] = useState<"restaurant" | "product">("restaurant");
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");

    const restaurantData = useMerchantReviews(page);
    const productData = useMerchantProductReviews(page);

    const reviews = tab === "restaurant" ? restaurantData.reviews : productData.reviews;
    const total = tab === "restaurant" ? restaurantData.total : productData.total;
    const totalPages = tab === "restaurant" ? restaurantData.totalPages : productData.totalPages;
    const isLoading = tab === "restaurant" ? restaurantData.isLoading : productData.isLoading;
    const reload = tab === "restaurant" ? restaurantData.reload : productData.reload;

    const filtered = useMemo(() => {
        if (!search.trim()) return reviews;
        const q = search.toLowerCase();

        if (tab === "restaurant") {
            return (reviews as MerchantReview[]).filter(
                (r) =>
                    r.customerName.toLowerCase().includes(q) ||
                    (r.comment ?? "").toLowerCase().includes(q)
            );
        }

        return (reviews as MerchantProductReview[]).filter(
            (r) =>
                r.customerName.toLowerCase().includes(q) ||
                r.productName.toLowerCase().includes(q) ||
                (r.comment ?? "").toLowerCase().includes(q)
        );
    }, [reviews, search, tab]);

    const avgRating = useMemo(() => {
        if (reviews.length === 0) return 0;
        return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    }, [reviews]);

    const handleRespond = async (reviewId: string, response: string) => {
        const endpoint = tab === "restaurant"
            ? `/api/restaurant/reviews/${reviewId}`
            : `/api/restaurant/product-reviews/${reviewId}`;

        const res = await fetch(endpoint, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ response }),
        });
        if (!res.ok) throw new Error("Erreur");
        reload();
    };

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Avis clients</h1>
                <p className="text-surface-500 dark:text-surface-400 mt-1">
                    Consultez et répondez aux avis de vos clients
                </p>
            </div>

            <div className="mb-4 inline-flex p-1 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900">
                <button
                    onClick={() => { setTab("restaurant"); setPage(1); }}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${tab === "restaurant" ? "bg-brand-500 text-white" : "text-surface-600 dark:text-surface-400"}`}
                >
                    Avis restaurant
                </button>
                <button
                    onClick={() => { setTab("product"); setPage(1); }}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${tab === "product" ? "bg-brand-500 text-white" : "text-surface-600 dark:text-surface-400"}`}
                >
                    Avis produits
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <Card className="p-4">
                    <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide">Total avis</p>
                    <p className="text-2xl font-bold text-surface-900 dark:text-white mt-1">{total}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide">Note moyenne</p>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-2xl font-bold text-surface-900 dark:text-white">{avgRating > 0 ? avgRating.toFixed(1) : "—"}</p>
                        <StarDisplay rating={Math.round(avgRating)} size={16} />
                    </div>
                </Card>
                <Card className="p-4">
                    <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide">Sans réponse</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                        {reviews.filter((r) => !r.response).length}
                    </p>
                </Card>
            </div>

            <div className="mb-4 max-w-sm relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                <input
                    type="text"
                    placeholder={tab === "product" ? "Rechercher un avis ou produit..." : "Rechercher un avis..."}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-32 bg-surface-100 dark:bg-surface-800 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon={<MessageSquare size={48} />}
                    title="Aucun avis"
                    description={tab === "product" ? "Vos clients n'ont pas encore laissé d'avis produit." : "Vos clients n'ont pas encore laissé d'avis."}
                />
            ) : (
                <div className="space-y-3">
                    {tab === "restaurant" ? (
                        (filtered as MerchantReview[]).map((review) => (
                            <ReviewCard key={review.id} review={review} onRespond={handleRespond} />
                        ))
                    ) : (
                        (filtered as MerchantProductReview[]).map((review) => (
                            <ProductReviewCard key={review.id} review={review} onRespond={handleRespond} />
                        ))
                    )}
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="p-2 rounded-lg border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-30 transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm text-surface-500">
                        Page {page} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="p-2 rounded-lg border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-30 transition-colors"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}
