import type { Metadata } from "next";
import { ClientSectionPage } from "@/components/store/ClientSectionPage";

export const metadata: Metadata = {
    title: "Notifications — Kbouffe",
    description: "Configurez les notifications de vos commandes et offres Kbouffe.",
};

export default function StoresNotificationsPage() {
    return <ClientSectionPage section="notifications" />;
}
