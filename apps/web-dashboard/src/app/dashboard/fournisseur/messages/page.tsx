"use client";
import dynamic from "next/dynamic";

const MessagesContent = dynamic(() => import("./MessagesContent"), { ssr: false });

export default function MessagesPage() {
  return <MessagesContent />;
}
