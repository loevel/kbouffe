"use client";

import Script from "next/script";
import { trackPageView } from "@/lib/tracking";
import { useEffect } from "react";

interface TrackingPixelsProps {
    metaPixelId: string | null;
    googleAnalyticsId: string | null;
}

/**
 * Injects Meta Pixel and/or Google Analytics 4 scripts into the storefront
 * when the restaurant owner has configured their pixel IDs.
 */
export function TrackingPixels({ metaPixelId, googleAnalyticsId }: TrackingPixelsProps) {
    // Fire page view after scripts are loaded
    useEffect(() => {
        if (metaPixelId || googleAnalyticsId) {
            // Small delay to let scripts initialize
            const timer = setTimeout(() => trackPageView(), 500);
            return () => clearTimeout(timer);
        }
    }, [metaPixelId, googleAnalyticsId]);

    if (!metaPixelId && !googleAnalyticsId) return null;

    return (
        <>
            {/* ── Meta Pixel ─────────────────────────────────────── */}
            {metaPixelId && (
                <Script
                    id="meta-pixel"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `
                            !function(f,b,e,v,n,t,s)
                            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                            n.queue=[];t=b.createElement(e);t.async=!0;
                            t.src=v;s=b.getElementsByTagName(e)[0];
                            s.parentNode.insertBefore(t,s)}(window, document,'script',
                            'https://connect.facebook.net/en_US/fbevents.js');
                            fbq('init', '${metaPixelId}');
                        `,
                    }}
                />
            )}

            {/* ── Google Analytics 4 ─────────────────────────────── */}
            {googleAnalyticsId && (
                <>
                    <Script
                        id="ga4-gtag"
                        strategy="afterInteractive"
                        src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
                    />
                    <Script
                        id="ga4-config"
                        strategy="afterInteractive"
                        dangerouslySetInnerHTML={{
                            __html: `
                                window.dataLayer = window.dataLayer || [];
                                function gtag(){dataLayer.push(arguments);}
                                gtag('js', new Date());
                                gtag('config', '${googleAnalyticsId}', {
                                    send_page_view: true,
                                    currency: 'XAF'
                                });
                            `,
                        }}
                    />
                </>
            )}
        </>
    );
}
