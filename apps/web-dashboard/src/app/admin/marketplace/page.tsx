"use client";
import dynamic from "next/dynamic";

const MarketplaceContent = dynamic(() => import("./MarketplaceContent"), { ssr: false });

export default function MarketplacePage() {
  return <MarketplaceContent />;
}
