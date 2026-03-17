import type { Metadata } from "next";
import { ClientSectionPage } from "@/components/store/ClientSectionPage";

export const metadata: Metadata = {
    title: "Aide & support — Kbouffe",
    description: "Accédez au support Kbouffe pour vos commandes et votre compte.",
};

export default function StoresSupportPage() {
    return <ClientSectionPage section="support" />;
}
