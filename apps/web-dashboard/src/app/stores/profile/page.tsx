import type { Metadata } from "next";
import { ClientSectionPage } from "@/components/store/ClientSectionPage";

export const metadata: Metadata = {
    title: "Mon profil — Kbouffe",
    description: "Mettez à jour les informations de votre profil client Kbouffe.",
};

export default function StoresProfilePage() {
    return <ClientSectionPage section="profile" />;
}
