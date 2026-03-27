import type { Metadata } from "next";
import { ClientSectionPage } from "@/components/store/ClientSectionPage";

export const metadata: Metadata = {
    title: "Sécurité — Kbouffe",
    description: "Gérez la sécurité de votre compte client Kbouffe.",
};

export default function StoresSecurityPage() {
    return <ClientSectionPage section="security" />;
}
