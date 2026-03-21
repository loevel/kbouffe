"use client";

import { useState, useEffect, useCallback } from "react";

export interface MerchantReview {
    id: string;
    order_id: string | null;
    customer_id: string;
    rating: number;
    comment: string | null;
    response: string | null;
    is_visible: boolean;
    created_at: string;
    updated_at: string | null;
    customerName: string;
}

export function useMerchantReviews(page = 1) {
    const [reviews, setReviews] = useState<MerchantReview[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const load = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/restaurant/reviews?page=${page}`, { cache: "no-store" });
            if (!res.ok) throw new Error("Erreur");
            const data = await res.json() as any;
            setReviews(data.reviews ?? []);
            setTotal(data.total ?? 0);
            setTotalPages(data.totalPages ?? 0);
        } catch {
            setReviews([]);
        } finally {
            setIsLoading(false);
        }
    }, [page]);

    useEffect(() => { load(); }, [load]);

    return { reviews, total, totalPages, isLoading, reload: load };
}
