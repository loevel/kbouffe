"use client";

import { useEffect, useRef, useCallback } from "react";

interface TurnstileProps {
    siteKey: string;
    onVerify: (token: string) => void;
    onError?: () => void;
    onExpire?: () => void;
    theme?: "light" | "dark" | "auto";
    size?: "normal" | "compact" | "flexible";
    className?: string;
}

declare global {
    interface Window {
        turnstile?: {
            render: (
                container: HTMLElement,
                options: Record<string, unknown>
            ) => string;
            reset: (widgetId: string) => void;
            remove: (widgetId: string) => void;
        };
        onTurnstileLoad?: () => void;
    }
}

export function Turnstile({
    siteKey,
    onVerify,
    onError,
    onExpire,
    theme = "auto",
    size = "normal",
    className,
}: TurnstileProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);

    const renderWidget = useCallback(() => {
        if (!containerRef.current || !window.turnstile) return;

        // Nettoyer le widget précédent
        if (widgetIdRef.current) {
            window.turnstile.remove(widgetIdRef.current);
        }

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            callback: onVerify,
            "error-callback": onError,
            "expired-callback": onExpire,
            theme,
            size,
        });
    }, [siteKey, onVerify, onError, onExpire, theme, size]);

    useEffect(() => {
        // Charger le script Turnstile si pas déjà chargé
        if (window.turnstile) {
            renderWidget();
            return;
        }

        window.onTurnstileLoad = renderWidget;

        const script = document.createElement("script");
        script.src =
            "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

        return () => {
            if (widgetIdRef.current && window.turnstile) {
                window.turnstile.remove(widgetIdRef.current);
            }
        };
    }, [renderWidget]);

    return <div ref={containerRef} className={className} />;
}
