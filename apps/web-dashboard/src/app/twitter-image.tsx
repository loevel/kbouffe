/**
 * Twitter card image — 1200×600 PNG for Twitter/X sharing.
 * Next.js generates this automatically from this file.
 */
import { ImageResponse } from "next/og";

export const alt = "Kbouffe — Commandez en ligne au Cameroun";
export const size = { width: 1200, height: 600 };
export const contentType = "image/png";

export default function TwitterImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: 1200,
                    height: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                    position: "relative",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                }}
            >
                {/* Decorative glow */}
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 600,
                        height: 600,
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 60%)",
                    }}
                />

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 24,
                    }}
                >
                    {/* Icon */}
                    <div
                        style={{
                            width: 100,
                            height: 100,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: 24,
                            background: "#f97316",
                            boxShadow: "0 16px 48px rgba(249,115,22,0.3)",
                        }}
                    >
                        <svg width="66" height="66" viewBox="0 0 120 120" fill="none">
                            <rect x="30" y="24" width="8" height="72" rx="4" fill="white" />
                            <rect x="24" y="24" width="4" height="20" rx="2" fill="white" opacity="0.85" />
                            <rect x="33" y="24" width="4" height="20" rx="2" fill="white" opacity="0.85" />
                            <rect x="42" y="24" width="4" height="20" rx="2" fill="white" opacity="0.85" />
                            <rect x="24" y="42" width="22" height="5" rx="2.5" fill="white" opacity="0.7" />
                            <path d="M44 60 L82 28 C84 26 88 26 90 28 L92 30 C94 32 94 36 92 38 L50 60" fill="white" opacity="0.95" />
                            <path d="M44 62 L86 94 C88 96 88 100 86 102 L84 104 C82 106 78 106 76 104 L44 68" fill="white" opacity="0.9" />
                        </svg>
                    </div>

                    {/* Text */}
                    <div style={{ display: "flex", fontSize: 64, fontWeight: 800, letterSpacing: -2, color: "white" }}>
                        K<span style={{ color: "#f97316" }}>bouffe</span>
                    </div>

                    <div style={{ fontSize: 22, color: "#94a3b8", fontWeight: 500 }}>
                        Votre restaurant en ligne au Cameroun — 0% commission
                    </div>
                </div>
            </div>
        ),
        { ...size }
    );
}
