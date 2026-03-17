/**
 * Apple Touch Icon — 180×180 PNG for iOS home screen.
 * Next.js generates this automatically from this file.
 */
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: 180,
                    height: 180,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 40,
                    background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                }}
            >
                <svg
                    width="120"
                    height="120"
                    viewBox="0 0 120 120"
                    fill="none"
                >
                    {/* Fork handle */}
                    <rect x="30" y="24" width="8" height="72" rx="4" fill="white" />
                    {/* Prongs */}
                    <rect x="24" y="24" width="4" height="20" rx="2" fill="white" opacity="0.85" />
                    <rect x="33" y="24" width="4" height="20" rx="2" fill="white" opacity="0.85" />
                    <rect x="42" y="24" width="4" height="20" rx="2" fill="white" opacity="0.85" />
                    {/* Fork neck */}
                    <rect x="24" y="42" width="22" height="5" rx="2.5" fill="white" opacity="0.7" />
                    {/* Upper K arm */}
                    <path
                        d="M44 60 L82 28 C84 26 88 26 90 28 L92 30 C94 32 94 36 92 38 L50 60"
                        fill="white"
                        opacity="0.95"
                    />
                    {/* Lower K arm */}
                    <path
                        d="M44 62 L86 94 C88 96 88 100 86 102 L84 104 C82 106 78 106 76 104 L44 68"
                        fill="white"
                        opacity="0.9"
                    />
                    {/* Steam wisps */}
                    <path d="M62 18 C62 14 66 12 66 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.5" />
                    <path d="M72 20 C72 16 76 14 76 10" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />
                </svg>
            </div>
        ),
        { ...size }
    );
}
