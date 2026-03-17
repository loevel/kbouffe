/**
 * Open Graph image — 1200×630 PNG for social media sharing.
 * Next.js generates this automatically from this file at /opengraph-image.
 *
 * Shows the Kbouffe brand with tagline on a dark background.
 */
import { ImageResponse } from "next/og";

export const alt = "Kbouffe — Votre restaurant en ligne au Cameroun";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: 1200,
                    height: 630,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(145deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
                    position: "relative",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                }}
            >
                {/* Background decorative gradient circles */}
                <div
                    style={{
                        position: "absolute",
                        top: -100,
                        right: -50,
                        width: 500,
                        height: 500,
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        bottom: -80,
                        left: -30,
                        width: 400,
                        height: 400,
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%)",
                    }}
                />

                {/* Logo icon */}
                <div
                    style={{
                        width: 120,
                        height: 120,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 28,
                        background: "#f97316",
                        marginBottom: 32,
                        boxShadow: "0 20px 60px rgba(249,115,22,0.3)",
                    }}
                >
                    <svg width="80" height="80" viewBox="0 0 120 120" fill="none">
                        <rect x="30" y="24" width="8" height="72" rx="4" fill="white" />
                        <rect x="24" y="24" width="4" height="20" rx="2" fill="white" opacity="0.85" />
                        <rect x="33" y="24" width="4" height="20" rx="2" fill="white" opacity="0.85" />
                        <rect x="42" y="24" width="4" height="20" rx="2" fill="white" opacity="0.85" />
                        <rect x="24" y="42" width="22" height="5" rx="2.5" fill="white" opacity="0.7" />
                        <path d="M44 60 L82 28 C84 26 88 26 90 28 L92 30 C94 32 94 36 92 38 L50 60" fill="white" opacity="0.95" />
                        <path d="M44 62 L86 94 C88 96 88 100 86 102 L84 104 C82 106 78 106 76 104 L44 68" fill="white" opacity="0.9" />
                        <path d="M62 18 C62 14 66 12 66 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.5" />
                        <path d="M72 20 C72 16 76 14 76 10" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />
                    </svg>
                </div>

                {/* Brand name */}
                <div
                    style={{
                        display: "flex",
                        fontSize: 72,
                        fontWeight: 800,
                        letterSpacing: -2,
                        color: "white",
                        lineHeight: 1,
                    }}
                >
                    K<span style={{ color: "#f97316" }}>bouffe</span>
                </div>

                {/* Tagline */}
                <div
                    style={{
                        fontSize: 24,
                        color: "rgba(148, 163, 184, 0.9)",
                        marginTop: 16,
                        fontWeight: 500,
                    }}
                >
                    Votre restaurant en ligne au Cameroun
                </div>

                {/* Feature pills */}
                <div
                    style={{
                        display: "flex",
                        gap: 16,
                        marginTop: 40,
                    }}
                >
                    {["0% commission", "Mobile Money", "2 min pour commencer"].map((text) => (
                        <div
                            key={text}
                            style={{
                                padding: "10px 24px",
                                borderRadius: 50,
                                background: "rgba(249,115,22,0.1)",
                                border: "1px solid rgba(249,115,22,0.2)",
                                color: "#fdba74",
                                fontSize: 16,
                                fontWeight: 600,
                            }}
                        >
                            {text}
                        </div>
                    ))}
                </div>

                {/* Domain */}
                <div
                    style={{
                        position: "absolute",
                        bottom: 32,
                        color: "rgba(100, 116, 139, 0.6)",
                        fontSize: 16,
                        fontWeight: 500,
                    }}
                >
                    kbouffe.com
                </div>
            </div>
        ),
        { ...size }
    );
}
