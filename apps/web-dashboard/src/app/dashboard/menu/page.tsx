"use client";
import dynamic from "next/dynamic";

const MenuContent = dynamic(() => import("./MenuContent"), { ssr: false });

export default function MenuPage() {
    return <MenuContent />;
}
