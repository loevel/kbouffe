/**
 * E-commerce tracking helpers for Meta Pixel (fbq) and Google Analytics 4 (gtag).
 * Called from storefront components when pixel IDs are configured.
 */

declare global {
    interface Window {
        fbq?: (...args: unknown[]) => void;
        gtag?: (...args: unknown[]) => void;
    }
}

interface TrackParams {
    content_name?: string;
    content_ids?: string[];
    content_type?: string;
    value?: number;
    currency?: string;
    num_items?: number;
    [key: string]: unknown;
}

/**
 * Maps a unified event name to Meta Pixel + GA4 event names and fires both.
 */
const EVENT_MAP: Record<string, { fbq: string; gtag: string }> = {
    ViewContent: { fbq: "ViewContent", gtag: "view_item" },
    AddToCart: { fbq: "AddToCart", gtag: "add_to_cart" },
    InitiateCheckout: { fbq: "InitiateCheckout", gtag: "begin_checkout" },
    Purchase: { fbq: "Purchase", gtag: "purchase" },
    Search: { fbq: "Search", gtag: "search" },
};

export function trackEvent(eventName: string, params?: TrackParams) {
    if (typeof window === "undefined") return;

    const mapped = EVENT_MAP[eventName];
    const fbqName = mapped?.fbq ?? eventName;
    const gtagName = mapped?.gtag ?? eventName;

    // Meta Pixel
    if (window.fbq) {
        try {
            window.fbq("track", fbqName, params);
        } catch (e) {
            console.warn("[tracking] fbq error:", e);
        }
    }

    // Google Analytics 4
    if (window.gtag) {
        try {
            window.gtag("event", gtagName, {
                ...params,
                currency: params?.currency ?? "XAF",
            });
        } catch (e) {
            console.warn("[tracking] gtag error:", e);
        }
    }
}

export function trackPageView() {
    if (typeof window === "undefined") return;

    if (window.fbq) {
        try {
            window.fbq("track", "PageView");
        } catch (_) {}
    }

    // GA4 page_view is automatic with gtag config, but fire explicitly if needed
    if (window.gtag) {
        try {
            window.gtag("event", "page_view");
        } catch (_) {}
    }
}
