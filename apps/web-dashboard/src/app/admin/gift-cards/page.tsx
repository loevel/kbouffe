"use client";
import dynamic from "next/dynamic";

const GiftCardsContent = dynamic(() => import("./GiftCardsContent"), { ssr: false });

export default function GiftCardsPage() {
  return <GiftCardsContent />;
}
