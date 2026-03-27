import type { Metadata } from "next";
import { ClientSectionPage } from "@/components/store/ClientSectionPage";

export const metadata: Metadata = {
    title: "Offres & promotions — Kbouffe",
    description: "Découvrez vos promotions actives et codes promo Kbouffe.",
};

export default function StoresPromotionsPage() {
    return <ClientSectionPage section="promotions" />;
}
