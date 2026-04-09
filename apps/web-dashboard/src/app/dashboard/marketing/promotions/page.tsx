"use client";
import dynamic from "next/dynamic";

const PromotionsContent = dynamic(() => import("./PromotionsContent"), { ssr: false });

export default function PromotionsPage() {
    return <PromotionsContent />;
}
