"use client";

import dynamic from "next/dynamic";

const ReservationsContent = dynamic(() => import("./ReservationsContent"), { ssr: false });

export default function ReservationsPage() {
    return <ReservationsContent />;
}
