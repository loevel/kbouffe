"use client";
import dynamic from "next/dynamic";

const SecuriteContent = dynamic(() => import("./SecuriteContent"), { ssr: false });

export default function FournisseurSecuritePage() {
  return <SecuriteContent />;
}
