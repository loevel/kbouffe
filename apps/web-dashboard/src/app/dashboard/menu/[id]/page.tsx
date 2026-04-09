"use client";
import dynamic from "next/dynamic";

const MenuItemContent = dynamic(() => import("./MenuItemContent"), { ssr: false });

export default function MenuItemPage() {
    return <MenuItemContent />;
}
