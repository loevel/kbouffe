"use client";
import dynamic from "next/dynamic";

const EmailTemplatesContent = dynamic(() => import("./EmailTemplatesContent"), { ssr: false });

export default function EmailTemplatesPage() {
  return <EmailTemplatesContent />;
}
