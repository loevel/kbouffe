"use client";

import dynamic from "next/dynamic";

const TablesContent = dynamic(() => import("./TablesContent"), { ssr: false });

export default function TablesPage() {
    return <TablesContent />;
}
