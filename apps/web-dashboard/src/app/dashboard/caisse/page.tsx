"use client";
import dynamic from "next/dynamic";

const CaisseContent = dynamic(() => import("./CaisseContent"), { ssr: false });

export default function CaissePage() {
  return <CaisseContent />;
}
