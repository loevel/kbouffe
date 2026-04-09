"use client";

import dynamic from "next/dynamic";

const ProfilContent = dynamic(() => import("./ProfilContent"), { ssr: false });

export default function ProfilPage() {
    return <ProfilContent />;
}
