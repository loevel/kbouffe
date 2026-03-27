import type { Metadata } from "next";
import { ClientSectionPage } from "@/components/store/ClientSectionPage";

export const metadata: Metadata = {
    title: "Mes réservations — Kbouffe",
    description: "Consultez et gérez vos réservations de restaurant sur Kbouffe.",
};

export default function StoresReservationsPage() {
    return <ClientSectionPage section="reservations" />;
}
