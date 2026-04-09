"use client";
import dynamic from "next/dynamic";

const NewItemContent = dynamic(() => import("./NewItemContent"), { ssr: false });

export default function NewMenuItemPage() {
    return <NewItemContent />;
}
