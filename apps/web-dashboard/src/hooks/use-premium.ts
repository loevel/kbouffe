import { useState, useEffect } from "react";

/**
 * Hook to check if the current restaurant has premium storefront access.
 * Uses /api/marketplace/check-feature endpoint.
 */
export function usePremiumCheck() {
    const [isPremium, setIsPremium] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        fetch("/api/marketplace/check-feature?feature=premium_storefront")
            .then((r) => r.json())
            .then((d) => {
                if (!cancelled) setIsPremium(d.active === true);
            })
            .catch(() => {
                if (!cancelled) setIsPremium(false);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, []);

    return { isPremium, loading };
}
