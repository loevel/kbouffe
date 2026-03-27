/**
 * Dashboard cover/hero image — used as dashboard tab OG image.
 * 1200×630 for social sharing from dashboard pages.
 */
import { ImageResponse } from "next/og";

export const alt = "Kbouffe Dashboard — Gérez votre restaurant";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function DashboardOgImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: 1200,
                    height: 630,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "60px 80px",
                    background: "linear-gradient(145deg, #0f172a 0%, #1e293b 100%)",
                    position: "relative",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                }}
            >
                {/* Decorative gradient */}
                <div
                    style={{
                        position: "absolute",
                        top: -100,
                        right: -100,
                        width: 600,
                        height: 600,
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)",
                    }}
                />

                {/* Left side: text */}
                <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 600 }}>
                    {/* Logo line */}
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div
                            style={{
                                width: 56,
                                height: 56,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: 14,
                                background: "#f97316",
                            }}
                        >
                            <svg width="36" height="36" viewBox="0 0 120 120" fill="none">
                                <rect x="30" y="24" width="8" height="72" rx="4" fill="white" />
                                <rect x="24" y="24" width="4" height="20" rx="2" fill="white" opacity="0.85" />
                                <rect x="33" y="24" width="4" height="20" rx="2" fill="white" opacity="0.85" />
                                <rect x="42" y="24" width="4" height="20" rx="2" fill="white" opacity="0.85" />
                                <rect x="24" y="42" width="22" height="5" rx="2.5" fill="white" opacity="0.7" />
                                <path d="M44 60 L82 28 C84 26 88 26 90 28 L92 30 C94 32 94 36 92 38 L50 60" fill="white" opacity="0.95" />
                                <path d="M44 62 L86 94 C88 96 88 100 86 102 L84 104 C82 106 78 106 76 104 L44 68" fill="white" opacity="0.9" />
                            </svg>
                        </div>
                        <div style={{ display: "flex", fontSize: 32, fontWeight: 800, color: "white", letterSpacing: -1 }}>
                            K<span style={{ color: "#f97316" }}>bouffe</span>
                        </div>
                    </div>

                    <div style={{ fontSize: 48, fontWeight: 800, color: "white", lineHeight: 1.1, letterSpacing: -1 }}>
                        Gérez votre restaurant en ligne
                    </div>

                    <div style={{ fontSize: 20, color: "#94a3b8", lineHeight: 1.5 }}>
                        Commandes, menu, paiements Mobile Money, livraisons — tout dans un seul tableau de bord.
                    </div>
                </div>

                {/* Right side: mock dashboard cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16, width: 340 }}>
                    {[
                        { label: "Commandes aujourd'hui", value: "47", change: "+12%" },
                        { label: "Chiffre d'affaires", value: "285 000 FCFA", change: "+8%" },
                        { label: "Note moyenne", value: "4.8 ⭐", change: "" },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            style={{
                                padding: "20px 24px",
                                borderRadius: 16,
                                background: "rgba(30, 41, 59, 0.8)",
                                border: "1px solid rgba(51, 65, 85, 0.5)",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <div style={{ fontSize: 13, color: "#94a3b8" }}>{stat.label}</div>
                                <div style={{ fontSize: 24, fontWeight: 700, color: "white" }}>{stat.value}</div>
                            </div>
                            {stat.change && (
                                <div
                                    style={{
                                        fontSize: 14,
                                        fontWeight: 600,
                                        color: "#4ade80",
                                        background: "rgba(74, 222, 128, 0.1)",
                                        padding: "4px 10px",
                                        borderRadius: 8,
                                    }}
                                >
                                    {stat.change}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        ),
        { ...size }
    );
}
