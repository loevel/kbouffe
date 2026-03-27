import type { Metadata } from "next";
import { ClientSectionPage } from "@/components/store/ClientSectionPage";

export const metadata: Metadata = {
    title: "Mes commandes — Kbouffe",
    description: "Suivez vos commandes en cours et consultez votre historique Kbouffe.",
};

export default function StoresOrdersPage() {
    return <ClientSectionPage section="orders" />;
}
