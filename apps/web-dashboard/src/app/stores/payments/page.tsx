import type { Metadata } from "next";
import { ClientSectionPage } from "@/components/store/ClientSectionPage";

export const metadata: Metadata = {
    title: "Moyens de paiement — Kbouffe",
    description: "Gérez vos moyens de paiement pour vos commandes Kbouffe.",
};

export default function StoresPaymentsPage() {
    return <ClientSectionPage section="payments" />;
}
