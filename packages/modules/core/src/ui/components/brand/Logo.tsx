/**
 * Kbouffe brand logo — SVG-based logo components.
 */
import React from "react";

export const BRAND_COLORS = {
    primary: "#f97316",
    dark: "#ea580c",
    darker: "#c2410c",
    accent: "#fdba74",
    light: "#fff7ed",
    white: "#ffffff",
    black: "#0f172a",
} as const;

interface IconProps {
    size?: number;
    className?: string;
    color?: string;
}

export function KbouffeIcon({ size = 40, className, color }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            role="img"
            aria-label="Kbouffe"
        >
            <rect
                width="120"
                height="120"
                rx="28"
                fill={color ?? BRAND_COLORS.primary}
            />
            <g>
                <rect x="30" y="24" width="8" height="72" rx="4" fill="white" />
                <rect x="24" y="24" width="4" height="20" rx="2" fill="white" opacity="0.85" />
                <rect x="33" y="24" width="4" height="20" rx="2" fill="white" opacity="0.85" />
                <rect x="42" y="24" width="4" height="20" rx="2" fill="white" opacity="0.85" />
                <rect x="24" y="42" width="22" height="5" rx="2.5" fill="white" opacity="0.7" />
            </g>
            <g>
                <path
                    d="M44 60 L82 28 C84 26 88 26 90 28 L92 30 C94 32 94 36 92 38 L50 60"
                    fill="white"
                    opacity="0.95"
                />
                <path
                    d="M48 58 L84 30"
                    stroke="rgba(249,115,22,0.3)"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
                <path
                    d="M44 62 L86 94 C88 96 88 100 86 102 L84 104 C82 106 78 106 76 104 L44 68"
                    fill="white"
                    opacity="0.9"
                />
            </g>
            <g opacity="0.5">
                <path
                    d="M62 18 C62 14 66 12 66 8"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                />
                <path
                    d="M72 20 C72 16 76 14 76 10"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                />
            </g>
        </svg>
    );
}

interface LogoProps {
    height?: number;
    className?: string;
    layout?: "horizontal" | "stacked";
    variant?: "default" | "white" | "dark";
    tagline?: boolean;
}

export function KbouffeLogo({
    height = 40,
    className,
    layout = "horizontal",
    variant = "default",
    tagline = false,
}: LogoProps) {
    const iconColor = variant === "white" ? BRAND_COLORS.white : BRAND_COLORS.primary;
    const textColor = variant === "white" ? BRAND_COLORS.white : BRAND_COLORS.black;

    return (
        <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
            <KbouffeIcon size={height} color={iconColor} />
            <div>
                <div
                    className="font-extrabold tracking-tight leading-none"
                    style={{ fontSize: height * 0.55, color: textColor }}
                >
                    K<span style={{ color: BRAND_COLORS.primary }}>bouffe</span>
                </div>
            </div>
        </div>
    );
}

export function KbouffeLogoWhite(props: Omit<LogoProps, "variant">) {
    return <KbouffeLogo {...props} variant="white" />;
}
