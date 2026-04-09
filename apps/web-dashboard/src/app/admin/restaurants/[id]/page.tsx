"use client";

import dynamic from "next/dynamic";

const RestaurantDetailContent = dynamic(() => import("./RestaurantDetailContent"), { ssr: false });

export default function RestaurantDetailPage() {
    return <RestaurantDetailContent />;
}
