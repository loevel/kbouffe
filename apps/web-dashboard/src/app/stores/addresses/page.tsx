import type { Metadata } from "next";
import { ClientSectionPage } from "@/components/store/ClientSectionPage";

export const metadata: Metadata = {
    title: "Mes adresses — Kbouffe",
    description: "Gérez vos adresses de livraison Kbouffe.",
};

export default function StoresAddressesPage() {
    return <ClientSectionPage section="addresses" />;
}
