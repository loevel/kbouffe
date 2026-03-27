import type { Metadata } from "next";
import { ClientSectionPage } from "@/components/store/ClientSectionPage";

export const metadata: Metadata = {
    title: "Préférences — Kbouffe",
    description: "Personnalisez vos préférences de commande et de livraison.",
};

export default function StoresPreferencesPage() {
    return <ClientSectionPage section="preferences" />;
}
