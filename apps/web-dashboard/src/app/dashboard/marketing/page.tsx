"use client";
import dynamic from "next/dynamic";

const MarketingContent = dynamic(() => import("./MarketingContent"), { ssr: false });

export default function MarketingPage() {
    return <MarketingContent />;
}
