"use client";
import dynamic from "next/dynamic";

const ProduitsContent = dynamic(() => import("./ProduitsContent"), { ssr: false });

export default function ProduitsPage() {
  return <ProduitsContent />;
}
