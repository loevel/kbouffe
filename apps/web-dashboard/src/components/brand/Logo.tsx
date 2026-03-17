/**
 * Kbouffe brand logo — SVG-based logo components.
 *
 * Variants:
 *   - KbouffeLogo:     Full logo (icon + wordmark)
 *   - KbouffeIcon:     Icon mark only (fork/knife forming a "K")
 *   - KbouffeWordmark: Text-only wordmark
 *
 * The icon is a stylized "K" formed by a fork and knife crossed,
 * representing food & dining — the core of Kbouffe's identity.
 *
 * Brand colors:
 *   Primary:  #f97316 (brand-500, warm orange)
 *   Dark:     #ea580c (brand-600)
 *   Accent:   #fdba74 (brand-300, light orange)
 */
import React from "react";

// ── Brand constants ──────────────────────────────────────────────────────

export const BRAND_COLORS = {
    primary: "#f97316",
    dark: "#ea580c",
    darker: "#c2410c",
    accent: "#fdba74",
    light: "#fff7ed",
    white: "#ffffff",
    black: "#0f172a",
} as const;

// ── Icon Mark ─────────────────────────────────────────────────────────────

interface IconProps {
    size?: number;
    className?: string;
    color?: string;
}

/**
 * Kbouffe icon mark — a stylized fork-and-knife forming a "K" shape
 * within a rounded square container.
 */
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
            {/* Rounded square background */}
            <rect
                width="120"
                height="120"
                rx="28"
                fill={color ?? BRAND_COLORS.primary}
            />

            {/* Fork prongs (left side of K) */}
            <g>
                {/* Fork handle — vertical line of "K" */}
                <rect x="30" y="24" width="8" height="72" rx="4" fill="white" />
                {/* Prong 1 */}
                <rect x="24" y="24" width="4" height="20" rx="2" fill="white" opacity="0.85" />
                {/* Prong 2 */}
                <rect x="33" y="24" width="4" height="20" rx="2" fill="white" opacity="0.85" />
                {/* Prong 3 */}
                <rect x="42" y="24" width="4" height="20" rx="2" fill="white" opacity="0.85" />
                {/* Fork neck connector */}
                <rect x="24" y="42" width="22" height="5" rx="2.5" fill="white" opacity="0.7" />
            </g>

            {/* Knife (diagonal arms of "K") */}
            <g>
                {/* Upper arm — knife blade going up-right */}
                <path
                    d="M44 60 L82 28 C84 26 88 26 90 28 L92 30 C94 32 94 36 92 38 L50 60"
                    fill="white"
                    opacity="0.95"
                />
                {/* Knife spine highlight */}
                <path
                    d="M48 58 L84 30"
                    stroke="rgba(249,115,22,0.3)"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
                {/* Lower arm — knife going down-right */}
                <path
                    d="M44 62 L86 94 C88 96 88 100 86 102 L84 104 C82 106 78 106 76 104 L44 68"
                    fill="white"
                    opacity="0.9"
                />
            </g>

            {/* Small steam wisps above (food = warmth) */}
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

/**
 * Flat icon (no background) — for use on colored backgrounds.
 */
export function KbouffeIconFlat({ size = 40, className, color }: IconProps) {
    const fill = color ?? BRAND_COLORS.primary;
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
            {/* Fork handle */}
            <rect x="18" y="12" width="10" height="96" rx="5" fill={fill} />
            {/* Prongs */}
            <rect x="10" y="12" width="5" height="26" rx="2.5" fill={fill} opacity="0.7" />
            <rect x="20" y="12" width="5" height="26" rx="2.5" fill={fill} opacity="0.7" />
            <rect x="30" y="12" width="5" height="26" rx="2.5" fill={fill} opacity="0.7" />
            {/* Fork plate */}
            <rect x="10" y="36" width="25" height="6" rx="3" fill={fill} opacity="0.5" />

            {/* Upper arm of K */}
            <path
                d="M34 60 L90 16 C93 14 97 14 100 17 L102 19 C105 22 105 26 102 29 L42 60"
                fill={fill}
            />
            {/* Lower arm of K */}
            <path
                d="M34 64 L96 112 C99 115 99 119 96 122 L94 124 C91 127 87 127 84 124 L34 72"
                fill={fill}
                opacity="0.85"
            />

            {/* Steam */}
            <g opacity="0.4">
                <path d="M56 6 C56 2 60 -1 60 -5" stroke={fill} strokeWidth="3" strokeLinecap="round" fill="none" />
                <path d="M68 8 C68 4 72 1 72 -3" stroke={fill} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </g>
        </svg>
    );
}

// ── Wordmark ──────────────────────────────────────────────────────────────

interface WordmarkProps {
    className?: string;
    color?: string;
    height?: number;
}

export function KbouffeWordmark({ height = 28, className, color }: WordmarkProps) {
    const fill = color ?? "currentColor";
    // Aspect ratio ~4.2:1 for "Kbouffe"
    const width = Math.round(height * 4.2);

    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 210 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            role="img"
            aria-label="Kbouffe"
        >
            <text
                x="0"
                y="40"
                fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
                fontWeight="800"
                fontSize="46"
                letterSpacing="-1"
                fill={fill}
            >
                K
                <tspan fill={BRAND_COLORS.primary}>bouffe</tspan>
            </text>
        </svg>
    );
}

// ── Full Logo (Icon + Wordmark) ───────────────────────────────────────────

interface LogoProps {
    /** Overall height of the logo */
    height?: number;
    /** CSS class */
    className?: string;
    /** "horizontal" = icon left, text right. "stacked" = icon top, text bottom */
    layout?: "horizontal" | "stacked";
    /** Color variation */
    variant?: "default" | "white" | "dark";
    /** Show tagline under wordmark */
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
    const textColor =
        variant === "white"
            ? BRAND_COLORS.white
            : variant === "dark"
              ? BRAND_COLORS.black
              : BRAND_COLORS.black;

    if (layout === "stacked") {
        return (
            <div className={`flex flex-col items-center gap-2 ${className ?? ""}`}>
                <KbouffeIcon size={height * 1.5} color={iconColor} />
                <div className="text-center">
                    <div
                        className="font-extrabold tracking-tight"
                        style={{ fontSize: height * 0.6, lineHeight: 1, color: textColor }}
                    >
                        K<span style={{ color: BRAND_COLORS.primary }}>bouffe</span>
                    </div>
                    {tagline && (
                        <div
                            className="mt-1 font-medium opacity-60"
                            style={{ fontSize: height * 0.22, color: textColor }}
                        >
                            La food, version camerounaise
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Horizontal layout (default)
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
                {tagline && (
                    <div
                        className="font-medium opacity-60 leading-tight"
                        style={{ fontSize: height * 0.2, color: textColor, marginTop: 2 }}
                    >
                        La food, version camerounaise
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Logo for dark backgrounds ─────────────────────────────────────────────

export function KbouffeLogoWhite(props: Omit<LogoProps, "variant">) {
    return <KbouffeLogo {...props} variant="white" />;
}

export function KbouffeLogoDark(props: Omit<LogoProps, "variant">) {
    return <KbouffeLogo {...props} variant="dark" />;
}
