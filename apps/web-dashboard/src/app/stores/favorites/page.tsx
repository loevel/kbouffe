import type { Metadata } from "next";
import { ClientSectionPage } from "@/components/store/ClientSectionPage";

export const metadata: Metadata = {
    title: "Mes favoris — Kbouffe",
    description: "Retrouvez tous vos restaurants et plats favoris sur Kbouffe.",
};

export default function StoresFavoritesPage() {
    return <ClientSectionPage section="favorites" />;
}
